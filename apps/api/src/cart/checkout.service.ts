import { Injectable } from "@nestjs/common";
import type { AuthenticatedSession } from "../auth/auth.service";
import type { CatalogLocale } from "../catalog/catalog.schemas";
import { PrismaService } from "../database/prisma.service";
import { Locale, OrderStatus, PublicationState } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import {
  cartEmpty,
  checkoutConflict,
  comicNotFound,
  insufficientStock,
  orderNotFound,
} from "../http/api-exception";
import type {
  CheckoutBody,
  OrderListQuery,
} from "./checkout.schemas";
import type {
  CheckoutAddressDto,
  CheckoutResponse,
  OrderDetailDto,
  OrderDetailResponse,
  OrderLineDto,
  OrderListResponse,
  OrderSummaryDto,
} from "./checkout.types";

const ORDER_NUMBER_RETRY_LIMIT = 3;

interface OrderLineRecord {
  comicSlug: string;
  sku: string;
  title: string;
  contentLocale: Locale;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  currencyCode: string;
}

interface OrderRecord {
  orderNumber: string;
  status: OrderStatus;
  createdAt: Date;
  recipientName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
  totalItems: number;
  totalAmountMinor: number;
  currencyCode: string;
  lines: OrderLineRecord[];
}

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(
    session: AuthenticatedSession,
    locale: CatalogLocale,
    body: CheckoutBody,
  ): Promise<CheckoutResponse> {
    for (let attempt = 0; attempt < ORDER_NUMBER_RETRY_LIMIT; attempt += 1) {
      try {
        const order = await this.prisma.$transaction(async (tx) => {
          const cart = await tx.cart.findUnique({
            where: { userId: session.user.id },
            select: {
              id: true,
              lines: {
                orderBy: [
                  { createdAt: "asc" },
                  { comic: { slug: "asc" } },
                ],
                select: {
                  quantity: true,
                  comic: {
                    select: {
                      id: true,
                      slug: true,
                      sku: true,
                      publicationState: true,
                      priceMinor: true,
                      currencyCode: true,
                      stockQuantity: true,
                      translations: {
                        where: {
                          locale: {
                            in: this.translationLocales(locale),
                          },
                        },
                        select: {
                          locale: true,
                          title: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          if (!cart || cart.lines.length === 0) {
            throw cartEmpty();
          }

          const snapshots = cart.lines.map((line) => {
            const comic = line.comic;

            if (comic.publicationState !== PublicationState.PUBLISHED) {
              throw comicNotFound();
            }

            if (line.quantity > comic.stockQuantity) {
              throw insufficientStock();
            }

            const translation = this.selectTranslation(
              comic.translations,
              locale,
            );
            const lineTotalMinor = comic.priceMinor * line.quantity;

            return {
              comicId: comic.id,
              comicSlug: comic.slug,
              sku: comic.sku,
              title: translation.title,
              contentLocale: translation.locale,
              quantity: line.quantity,
              unitPriceMinor: comic.priceMinor,
              lineTotalMinor,
              currencyCode: comic.currencyCode,
            };
          });

          const currencyCode = snapshots[0]?.currencyCode ?? "USD";
          if (
            snapshots.some(
              (snapshot) => snapshot.currencyCode !== currencyCode,
            )
          ) {
            throw checkoutConflict();
          }

          for (const snapshot of snapshots) {
            const stockUpdate = await tx.comic.updateMany({
              where: {
                id: snapshot.comicId,
                publicationState: PublicationState.PUBLISHED,
                stockQuantity: {
                  gte: snapshot.quantity,
                },
              },
              data: {
                stockQuantity: {
                  decrement: snapshot.quantity,
                },
              },
            });

            if (stockUpdate.count !== 1) {
              const current = await tx.comic.findUnique({
                where: { id: snapshot.comicId },
                select: {
                  publicationState: true,
                },
              });

              if (
                !current ||
                current.publicationState !== PublicationState.PUBLISHED
              ) {
                throw comicNotFound();
              }

              throw insufficientStock();
            }
          }

          const totalItems = snapshots.reduce(
            (sum, snapshot) => sum + snapshot.quantity,
            0,
          );
          const totalAmountMinor = snapshots.reduce(
            (sum, snapshot) => sum + snapshot.lineTotalMinor,
            0,
          );
          const orderNumber = await this.nextOrderNumber(tx, new Date());

          const order = await tx.order.create({
            data: {
              orderNumber,
              userId: session.user.id,
              status: OrderStatus.PLACED,
              recipientName: body.address.recipientName,
              addressLine1: body.address.addressLine1,
              addressLine2: body.address.addressLine2 ?? null,
              city: body.address.city,
              region: body.address.region ?? null,
              postalCode: body.address.postalCode,
              countryCode: body.address.countryCode,
              totalItems,
              totalAmountMinor,
              currencyCode,
              lines: {
                create: snapshots.map((snapshot) => ({
                  comicId: snapshot.comicId,
                  comicSlug: snapshot.comicSlug,
                  sku: snapshot.sku,
                  title: snapshot.title,
                  contentLocale: snapshot.contentLocale,
                  quantity: snapshot.quantity,
                  unitPriceMinor: snapshot.unitPriceMinor,
                  lineTotalMinor: snapshot.lineTotalMinor,
                  currencyCode: snapshot.currencyCode,
                })),
              },
            },
            include: {
              lines: {
                orderBy: { id: "asc" },
              },
            },
          });

          await tx.cartLine.deleteMany({
            where: {
              cartId: cart.id,
            },
          });

          return order;
        });

        return {
          data: {
            order: this.toOrderDetail(order),
          },
        };
      } catch (error) {
        if (
          this.isUniqueConstraintError(error) &&
          attempt < ORDER_NUMBER_RETRY_LIMIT - 1
        ) {
          continue;
        }

        throw error;
      }
    }

    throw checkoutConflict();
  }

  async listOrders(
    session: AuthenticatedSession,
    query: OrderListQuery,
  ): Promise<OrderListResponse> {
    const skip = (query.page - 1) * query.pageSize;
    const [orders, totalItems] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId: session.user.id },
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
        skip,
        take: query.pageSize,
        select: {
          orderNumber: true,
          status: true,
          createdAt: true,
          totalItems: true,
          totalAmountMinor: true,
          currencyCode: true,
        },
      }),
      this.prisma.order.count({
        where: { userId: session.user.id },
      }),
    ]);

    return {
      data: orders.map((order) => this.toOrderSummary(order)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages:
          totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  async orderDetail(
    session: AuthenticatedSession,
    orderNumber: string,
  ): Promise<OrderDetailResponse> {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,
        userId: session.user.id,
      },
      include: {
        lines: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!order) {
      throw orderNotFound();
    }

    return {
      data: {
        order: this.toOrderDetail(order),
      },
    };
  }

  private async nextOrderNumber(
    tx: Prisma.TransactionClient,
    now: Date,
  ): Promise<string> {
    const prefix = `QCG-${this.utcDateStamp(now)}-`;
    const latest = await tx.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: "desc",
      },
      select: {
        orderNumber: true,
      },
    });
    const sequence = latest
      ? Number(latest.orderNumber.slice(-4)) + 1
      : 1;

    if (sequence > 9999) {
      throw checkoutConflict();
    }

    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  private toOrderSummary(order: {
    orderNumber: string;
    status: OrderStatus;
    createdAt: Date;
    totalItems: number;
    totalAmountMinor: number;
    currencyCode: string;
  }): OrderSummaryDto {
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      totalItems: order.totalItems,
      total: {
        amountMinor: order.totalAmountMinor,
        currencyCode: order.currencyCode,
      },
    };
  }

  private toOrderDetail(order: OrderRecord): OrderDetailDto {
    return {
      ...this.toOrderSummary(order),
      address: this.toCheckoutAddress(order),
      items: order.lines.map((line) => this.toOrderLine(line)),
    };
  }

  private toCheckoutAddress(order: OrderRecord): CheckoutAddressDto {
    return {
      recipientName: order.recipientName,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      city: order.city,
      region: order.region,
      postalCode: order.postalCode,
      countryCode: order.countryCode,
    };
  }

  private toOrderLine(line: OrderLineRecord): OrderLineDto {
    return {
      comicSlug: line.comicSlug,
      sku: line.sku,
      title: line.title,
      contentLocale: line.contentLocale,
      quantity: line.quantity,
      unitPrice: {
        amountMinor: line.unitPriceMinor,
        currencyCode: line.currencyCode,
      },
      lineTotal: {
        amountMinor: line.lineTotalMinor,
        currencyCode: line.currencyCode,
      },
    };
  }

  private selectTranslation(
    translations: Array<{ locale: Locale; title: string }>,
    requestedLocale: CatalogLocale,
  ) {
    const translation =
      translations.find(
        (candidate) => candidate.locale === requestedLocale,
      ) ??
      translations.find(
        (candidate) => candidate.locale === Locale.en,
      );

    if (!translation) {
      throw checkoutConflict();
    }

    return translation;
  }

  private translationLocales(locale: CatalogLocale): Locale[] {
    const prismaLocale = locale === "ru" ? Locale.ru : Locale.en;

    return prismaLocale === Locale.en
      ? [Locale.en]
      : [prismaLocale, Locale.en];
  }

  private utcDateStamp(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}${month}${day}`;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}
