import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { CatalogDetailItem } from "../api/catalog.contract";
import { AddToCartButton } from "../../cart/components/AddToCartButton";
import { CatalogCover } from "./CatalogCover";
import { PriceDisplay } from "./PriceDisplay";
import { StockStatus } from "./StockStatus";

interface ComicDetailContentProps {
  comic: CatalogDetailItem;
  locale: "en" | "ru";
}

export function ComicDetailContent({ comic, locale }: ComicDetailContentProps) {
  const { t } = useTranslation();
  const seriesLabel = comic.series
    ? t("catalog.seriesIssue", {
        issueNumber: comic.series.issueNumber,
        title: comic.series.title,
      })
    : t("catalog.standalone");

  return (
    <section
      className="comic-detail"
      data-testid={`comic-detail--${comic.slug}`}
      aria-labelledby="comic-title"
    >
      <Link className="back-link" to={`/${locale}/comics`}>
        {t("actions.backToCatalog")}
      </Link>
      <div className="comic-detail__hero">
        <CatalogCover
          alt={t("catalog.coverAlt", { title: comic.title })}
          coverPath={comic.coverPath}
          eager
          variant="detail"
        />
        <div className="comic-detail__summary">
          <p className="eyebrow">{t("comic.eyebrow")}</p>
          <h1 id="comic-title">{comic.title}</h1>
          <p className="comic-detail__series">{seriesLabel}</p>
          <PriceDisplay
            amountMinor={comic.price.amountMinor}
            compareAtPrice={comic.compareAtPrice}
            currencyCode={comic.price.currencyCode}
            locale={locale}
          />
          <StockStatus
            inStock={comic.stock.inStock}
            quantity={comic.stock.quantity}
          />
          <AddToCartButton comic={comic} variant="detail" />
          <p className="comic-detail__sku">
            <span>{t("catalog.skuLabel")}</span> {comic.sku}
          </p>
        </div>
      </div>
      <div className="comic-detail__sections">
        <section aria-labelledby="comic-description-title">
          <h2 id="comic-description-title">{t("catalog.descriptionTitle")}</h2>
          <p className="comic-detail__description">{comic.description}</p>
        </section>
        <section aria-labelledby="comic-creators-title">
          <h2 id="comic-creators-title">{t("catalog.creatorsTitle")}</h2>
          <ul className="comic-detail__list">
            {comic.creators.map((creator) => (
              <li key={`${creator.slug}-${creator.role}`}>
                <span>{creator.displayName}</span>
                <span className="comic-detail__secondary">
                  {t(`catalog.roles.${creator.role}`)}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="comic-genres-title">
          <h2 id="comic-genres-title">{t("catalog.genresTitle")}</h2>
          <ul className="comic-detail__list comic-detail__list--inline">
            {comic.genres.map((genre) => (
              <li key={genre.slug}>{genre.name}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
