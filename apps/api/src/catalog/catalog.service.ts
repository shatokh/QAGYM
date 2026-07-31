import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import {
  CreatorRole,
  Locale,
  PublicationState,
} from "../generated/prisma/enums";
import { comicNotFound } from "../http/api-exception";
import type {
  CatalogFilterOptionsQuery,
  CatalogDetailQuery,
  CatalogListQuery,
  CatalogLocale,
} from "./catalog.schemas";
import type {
  CatalogCreator,
  CatalogDetailItem,
  CatalogDetailResponse,
  CatalogFilterOptionsResponse,
  CatalogGenre,
  CatalogListItem,
  CatalogListResponse,
} from "./catalog.types";

interface TranslationRecord {
  locale: Locale;
  title?: string;
  description?: string;
  name?: string;
}

interface CatalogRecord {
  slug: string;
  sku: string;
  issueNumber: number | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currencyCode: string;
  stockQuantity: number;
  coverPath: string | null;
  translations: TranslationRecord[];
  series: {
    slug: string;
    translations: TranslationRecord[];
  } | null;
  creators: Array<{
    role: CreatorRole;
    sortOrder: number;
    creator: {
      slug: string;
      displayName: string;
    };
  }>;
  genres: Array<{
    genre: {
      slug: string;
      translations: TranslationRecord[];
    };
  }>;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CatalogListQuery): Promise<CatalogListResponse> {
    const locale = this.toPrismaLocale(query.locale);
    const translations = this.translationSelection(locale);
    const skip = (query.page - 1) * query.pageSize;
    const where = {
      publicationState: PublicationState.PUBLISHED,
      ...(query.q
        ? {
            OR: [
              {
                sku: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
              {
                translations: {
                  some: {
                    locale: {
                      in:
                        locale === Locale.en
                          ? [Locale.en]
                          : [Locale.ru, Locale.en],
                    },
                    title: {
                      contains: query.q,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(query.genre
        ? {
            genres: {
              some: {
                genre: {
                  slug: query.genre,
                },
              },
            },
          }
        : {}),
      ...(query.series
        ? {
            series: {
              slug: query.series,
            },
          }
        : {}),
      ...(query.availability
        ? {
            stockQuantity:
              query.availability === "in-stock"
                ? { gt: 0 }
                : { equals: 0 },
          }
        : {}),
    };

    const totalItems = await this.prisma.comic.count({ where });
    const comics = await this.prisma.comic.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        slug: true,
        sku: true,
        issueNumber: true,
        priceMinor: true,
        compareAtPriceMinor: true,
        currencyCode: true,
        stockQuantity: true,
        coverPath: true,
        translations: {
          where: translations.where,
          select: {
            locale: true,
            title: true,
            description: true,
          },
        },
        series: {
          select: {
            slug: true,
            translations: {
              where: translations.where,
              select: {
                locale: true,
                title: true,
              },
            },
          },
        },
        creators: {
          orderBy: [
            { role: "asc" },
            { sortOrder: "asc" },
            { creator: { slug: "asc" } },
          ],
          select: {
            role: true,
            sortOrder: true,
            creator: {
              select: {
                slug: true,
                displayName: true,
              },
            },
          },
        },
        genres: {
          orderBy: {
            genre: {
              slug: "asc",
            },
          },
          select: {
            genre: {
              select: {
                slug: true,
                translations: {
                  where: translations.where,
                  select: {
                    locale: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      data: comics.map((comic) =>
        this.toListItem(comic, query.locale),
      ),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages:
          totalItems === 0
            ? 0
            : Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  async filterOptions(
    query: CatalogFilterOptionsQuery,
  ): Promise<CatalogFilterOptionsResponse> {
    const locale = this.toPrismaLocale(query.locale);
    const translations = this.translationSelection(locale);
    const [genres, series] = await Promise.all([
      this.prisma.genre.findMany({
        where: {
          comics: {
            some: {
              comic: {
                publicationState: PublicationState.PUBLISHED,
              },
            },
          },
        },
        orderBy: { slug: "asc" },
        select: {
          slug: true,
          translations: {
            where: translations.where,
            select: {
              locale: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.series.findMany({
        where: {
          comics: {
            some: {
              publicationState: PublicationState.PUBLISHED,
            },
          },
        },
        orderBy: { slug: "asc" },
        select: {
          slug: true,
          translations: {
            where: translations.where,
            select: {
              locale: true,
              title: true,
            },
          },
        },
      }),
    ]);

    return {
      data: {
        genres: genres.map((genre) => {
          const translation = this.selectTranslation(
            genre.translations,
            query.locale,
          );

          return {
            slug: genre.slug,
            name: this.requiredText(translation.name),
            contentLocale: translation.locale,
          };
        }),
        series: series.map((item) => {
          const translation = this.selectTranslation(
            item.translations,
            query.locale,
          );

          return {
            slug: item.slug,
            name: this.requiredText(translation.title),
            contentLocale: translation.locale,
          };
        }),
      },
    };
  }

  async detail(
    slug: string,
    query: CatalogDetailQuery,
  ): Promise<CatalogDetailResponse> {
    const locale = this.toPrismaLocale(query.locale);
    const translations = this.translationSelection(locale);
    const comic = await this.prisma.comic.findFirst({
      where: {
        slug,
        publicationState: PublicationState.PUBLISHED,
      },
      select: {
        slug: true,
        sku: true,
        issueNumber: true,
        priceMinor: true,
        compareAtPriceMinor: true,
        currencyCode: true,
        stockQuantity: true,
        coverPath: true,
        translations: {
          where: translations.where,
          select: {
            locale: true,
            title: true,
            description: true,
          },
        },
        series: {
          select: {
            slug: true,
            translations: {
              where: translations.where,
              select: {
                locale: true,
                title: true,
              },
            },
          },
        },
        creators: {
          orderBy: [
            { role: "asc" },
            { sortOrder: "asc" },
            { creator: { slug: "asc" } },
          ],
          select: {
            role: true,
            sortOrder: true,
            creator: {
              select: {
                slug: true,
                displayName: true,
              },
            },
          },
        },
        genres: {
          orderBy: {
            genre: {
              slug: "asc",
            },
          },
          select: {
            genre: {
              select: {
                slug: true,
                translations: {
                  where: translations.where,
                  select: {
                    locale: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!comic) {
      throw comicNotFound();
    }

    return {
      data: this.toDetailItem(comic, query.locale),
    };
  }

  private toListItem(
    comic: CatalogRecord,
    requestedLocale: CatalogLocale,
  ): CatalogListItem {
    const translation = this.selectTranslation(
      comic.translations,
      requestedLocale,
    );

    return {
      slug: comic.slug,
      sku: comic.sku,
      title: this.requiredText(translation.title),
      contentLocale: translation.locale,
      series:
        comic.series && comic.issueNumber
          ? this.toSeries(
              comic.series,
              comic.issueNumber,
              requestedLocale,
            )
          : null,
      creators: this.toCreators(comic),
      genres: this.toGenres(comic, requestedLocale),
      price: {
        amountMinor: comic.priceMinor,
        currencyCode: comic.currencyCode,
      },
      compareAtPrice:
        comic.compareAtPriceMinor === null
          ? null
          : {
              amountMinor: comic.compareAtPriceMinor,
              currencyCode: comic.currencyCode,
            },
      stock: {
        quantity: comic.stockQuantity,
        inStock: comic.stockQuantity > 0,
      },
      coverPath: comic.coverPath,
    };
  }

  private toDetailItem(
    comic: CatalogRecord,
    requestedLocale: CatalogLocale,
  ): CatalogDetailItem {
    const translation = this.selectTranslation(
      comic.translations,
      requestedLocale,
    );

    return {
      ...this.toListItem(comic, requestedLocale),
      description: this.requiredText(translation.description),
    };
  }

  private toSeries(
    series: NonNullable<CatalogRecord["series"]>,
    issueNumber: number,
    requestedLocale: CatalogLocale,
  ) {
    const translation = this.selectTranslation(
      series.translations,
      requestedLocale,
    );

    return {
      slug: series.slug,
      title: this.requiredText(translation.title),
      contentLocale: translation.locale,
      issueNumber,
    };
  }

  private toCreators(comic: CatalogRecord): CatalogCreator[] {
    const roleOrder: Record<CreatorRole, number> = {
      [CreatorRole.WRITER]: 0,
      [CreatorRole.ARTIST]: 1,
    };

    return [...comic.creators]
      .sort(
        (left, right) =>
          roleOrder[left.role] - roleOrder[right.role] ||
          left.sortOrder - right.sortOrder ||
          left.creator.slug.localeCompare(right.creator.slug),
      )
      .map(({ creator, role }) => ({
        slug: creator.slug,
        displayName: creator.displayName,
        role,
      }));
  }

  private toGenres(
    comic: CatalogRecord,
    requestedLocale: CatalogLocale,
  ): CatalogGenre[] {
    return [...comic.genres]
      .sort((left, right) =>
        left.genre.slug.localeCompare(right.genre.slug),
      )
      .map(({ genre }) => {
        const translation = this.selectTranslation(
          genre.translations,
          requestedLocale,
        );

        return {
          slug: genre.slug,
          name: this.requiredText(translation.name),
          contentLocale: translation.locale,
        };
      });
  }

  private selectTranslation<T extends TranslationRecord>(
    translations: T[],
    requestedLocale: CatalogLocale,
  ): T {
    const translation =
      translations.find(
        (candidate) => candidate.locale === requestedLocale,
      ) ??
      translations.find(
        (candidate) => candidate.locale === Locale.en,
      );

    if (!translation) {
      throw new Error("Required catalog translation is unavailable.");
    }

    return translation;
  }

  private requiredText(value: string | undefined): string {
    if (!value) {
      throw new Error("Required localized catalog text is unavailable.");
    }

    return value;
  }

  private toPrismaLocale(locale: CatalogLocale): Locale {
    return locale === "ru" ? Locale.ru : Locale.en;
  }

  private translationSelection(locale: Locale) {
    return {
      where: {
        locale: {
          in:
            locale === Locale.en
              ? [Locale.en]
              : [locale, Locale.en],
        },
      },
    } as const;
  }
}
