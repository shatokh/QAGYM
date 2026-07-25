import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { CatalogListItem } from "../api/catalog.contract";
import { CatalogCover } from "./CatalogCover";
import { PriceDisplay } from "./PriceDisplay";
import { StockStatus } from "./StockStatus";

interface ComicCardProps {
  comic: CatalogListItem;
  locale: "en" | "ru";
}

export function ComicCard({ comic, locale }: ComicCardProps) {
  const { t } = useTranslation();
  const seriesLabel = comic.series
    ? t("catalog.seriesIssue", {
        issueNumber: comic.series.issueNumber,
        title: comic.series.title,
      })
    : t("catalog.standalone");

  return (
    <li>
      <article className="comic-card" data-testid={`comic-card--${comic.slug}`}>
        <Link className="comic-card__link" to={`/${locale}/comics/${comic.slug}`}>
          <CatalogCover
            alt={t("catalog.coverAlt", { title: comic.title })}
            coverPath={comic.coverPath}
            variant="card"
          />
          <div className="comic-card__body">
            <h2>{comic.title}</h2>
            <p className="comic-card__series">{seriesLabel}</p>
            <p className="comic-card__metadata">
              {comic.creators.map((creator) => creator.displayName).join(", ")}
            </p>
            <p className="comic-card__metadata">
              {comic.genres.map((genre) => genre.name).join(", ")}
            </p>
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
          </div>
        </Link>
      </article>
    </li>
  );
}
