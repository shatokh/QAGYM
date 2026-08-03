import { Injectable } from "@nestjs/common";
import type { AuthenticatedSession } from "../auth/auth.service";
import type { CatalogLocale } from "../catalog/catalog.schemas";
import { PrismaService } from "../database/prisma.service";
import { Locale, PublicationState } from "../generated/prisma/enums";
import {
  cartLineNotFound,
  comicNotFound,
  insufficientStock,
} from "../http/api-exception";
import type { AddCartLineBody, UpdateCartLineBody } from "./cart.schemas";
import type { CartDto, CartItem, CartResponse } from "./cart.types";

interface CartLineRecord {
  quantity: number;
  createdAt: Date;
  comic: ComicForCart;
}

interface ComicForCart {
  id: number;
  slug: string;
  sku: string;
  priceMinor: number;
  currencyCode: string;
  stockQuantity: number;
  coverPath: string | null;
  translations: Array<{
    locale: Locale;
    title: string;
  }>;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(
    session: AuthenticatedSession,
    locale: CatalogLocale,
  ): Promise<CartResponse> {
    return {
      data: {
        cart: await this.readCart(session.user.id, locale),
      },
    };
  }

  async addLine(
    session: AuthenticatedSession,
    locale: CatalogLocale,
    body: AddCartLineBody,
  ): Promise<CartResponse> {
    const comic = await this.findPurchasableComic(body.comicSlug, locale);

    if (comic.stockQuantity <= 0) {
      throw comicNotFound();
    }

    await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id },
        update: {},
        select: { id: true },
      });
      const existing = await tx.cartLine.findUnique({
        where: {
          cartId_comicId: {
            cartId: cart.id,
            comicId: comic.id,
          },
        },
        select: { quantity: true },
      });
      const quantity = (existing?.quantity ?? 0) + body.quantity;

      this.assertQuantityAvailable(quantity, comic.stockQuantity);

      await tx.cartLine.upsert({
        where: {
          cartId_comicId: {
            cartId: cart.id,
            comicId: comic.id,
          },
        },
        create: {
          cartId: cart.id,
          comicId: comic.id,
          quantity,
        },
        update: {
          quantity,
        },
      });
    });

    return this.getCart(session, locale);
  }

  async updateLine(
    session: AuthenticatedSession,
    locale: CatalogLocale,
    comicSlug: string,
    body: UpdateCartLineBody,
  ): Promise<CartResponse> {
    const comic = await this.findPurchasableComic(comicSlug, locale);

    this.assertQuantityAvailable(body.quantity, comic.stockQuantity);

    const result = await this.prisma.cartLine.updateMany({
      where: {
        comicId: comic.id,
        cart: {
          userId: session.user.id,
        },
      },
      data: {
        quantity: body.quantity,
      },
    });

    if (result.count === 0) {
      throw cartLineNotFound();
    }

    return this.getCart(session, locale);
  }

  async removeLine(
    session: AuthenticatedSession,
    comicSlug: string,
  ): Promise<void> {
    await this.prisma.cartLine.deleteMany({
      where: {
        comic: {
          slug: comicSlug,
        },
        cart: {
          userId: session.user.id,
        },
      },
    });
  }

  private async readCart(
    userId: number,
    locale: CatalogLocale,
  ): Promise<CartDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: {
        lines: {
          orderBy: [
            { createdAt: "asc" },
            { comic: { slug: "asc" } },
          ],
          select: {
            quantity: true,
            createdAt: true,
            comic: {
              select: this.comicSelection(locale),
            },
          },
        },
      },
    });

    const items = (cart?.lines ?? []).map((line) =>
      this.toCartItem(line, locale),
    );
    const subtotal = items.reduce(
      (total, item) => total + item.lineTotal.amountMinor,
      0,
    );
    const totalItems = items.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    return {
      items,
      totalItems,
      subtotal: {
        amountMinor: subtotal,
        currencyCode: "USD",
      },
    };
  }

  private async findPurchasableComic(
    slug: string,
    locale: CatalogLocale,
  ): Promise<ComicForCart> {
    const comic = await this.prisma.comic.findFirst({
      where: {
        slug,
        publicationState: PublicationState.PUBLISHED,
      },
      select: this.comicSelection(locale),
    });

    if (!comic) {
      throw comicNotFound();
    }

    return comic;
  }

  private comicSelection(locale: CatalogLocale) {
    const prismaLocale = this.toPrismaLocale(locale);

    return {
      id: true,
      slug: true,
      sku: true,
      priceMinor: true,
      currencyCode: true,
      stockQuantity: true,
      coverPath: true,
      translations: {
        where: {
          locale: {
            in:
              prismaLocale === Locale.en
                ? [Locale.en]
                : [prismaLocale, Locale.en],
          },
        },
        select: {
          locale: true,
          title: true,
        },
      },
    } as const;
  }

  private toCartItem(
    line: CartLineRecord,
    requestedLocale: CatalogLocale,
  ): CartItem {
    const translation = this.selectTranslation(
      line.comic.translations,
      requestedLocale,
    );
    const amountMinor = line.comic.priceMinor * line.quantity;

    return {
      comicSlug: line.comic.slug,
      sku: line.comic.sku,
      title: translation.title,
      contentLocale: translation.locale,
      quantity: line.quantity,
      unitPrice: {
        amountMinor: line.comic.priceMinor,
        currencyCode: line.comic.currencyCode,
      },
      lineTotal: {
        amountMinor,
        currencyCode: line.comic.currencyCode,
      },
      stock: {
        quantity: line.comic.stockQuantity,
        inStock: line.comic.stockQuantity > 0,
      },
      coverPath: line.comic.coverPath,
    };
  }

  private assertQuantityAvailable(
    quantity: number,
    stockQuantity: number,
  ): void {
    if (quantity > stockQuantity) {
      throw insufficientStock();
    }
  }

  private selectTranslation(
    translations: ComicForCart["translations"],
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
      throw new Error("Required cart item translation is unavailable.");
    }

    return translation;
  }

  private toPrismaLocale(locale: CatalogLocale): Locale {
    return locale === "ru" ? Locale.ru : Locale.en;
  }
}
