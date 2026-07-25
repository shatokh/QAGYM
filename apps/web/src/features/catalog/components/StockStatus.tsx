import { useTranslation } from "react-i18next";

interface StockStatusProps {
  inStock: boolean;
  quantity: number;
}

export function StockStatus({ inStock, quantity }: StockStatusProps) {
  const { t } = useTranslation();

  return (
    <span
      className={`stock-status ${inStock ? "stock-status--available" : "stock-status--empty"}`}
    >
      {inStock
        ? t("catalog.stockAvailable", { count: quantity })
        : t("catalog.stockUnavailable")}
    </span>
  );
}
