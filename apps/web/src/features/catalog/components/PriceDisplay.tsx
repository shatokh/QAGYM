import { useTranslation } from "react-i18next";

interface PriceDisplayProps {
  amountMinor: number;
  compareAtPrice: { amountMinor: number; currencyCode: string } | null;
  currencyCode: string;
  locale: string;
}

export function formatMoney(
  amountMinor: number,
  currencyCode: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    currency: currencyCode,
    currencyDisplay: "symbol",
    style: "currency",
  }).format(amountMinor / 100);
}

export function PriceDisplay({
  amountMinor,
  compareAtPrice,
  currencyCode,
  locale,
}: PriceDisplayProps) {
  const { t } = useTranslation();
  const currentPrice = formatMoney(amountMinor, currencyCode, locale);

  return (
    <div className="price-display">
      <strong>{currentPrice}</strong>
      {compareAtPrice ? (
        <del
          aria-label={t("catalog.previousPrice", {
            price: formatMoney(
              compareAtPrice.amountMinor,
              compareAtPrice.currencyCode,
              locale,
            ),
          })}
        >
          {formatMoney(
            compareAtPrice.amountMinor,
            compareAtPrice.currencyCode,
            locale,
          )}
        </del>
      ) : null}
    </div>
  );
}
