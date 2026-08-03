import { useTranslation } from "react-i18next";
import type { CatalogListItem } from "../../catalog/api/catalog.contract";
import { useAddCartLineMutation } from "../api/cart.queries";

interface AddToCartButtonProps {
  comic: Pick<CatalogListItem, "slug" | "stock" | "title">;
  variant?: "card" | "detail";
}

export function AddToCartButton({
  comic,
  variant = "card",
}: AddToCartButtonProps) {
  const { t } = useTranslation();
  const addLine = useAddCartLineMutation();
  const isCurrentComicPending =
    addLine.isPending && addLine.variables?.comicSlug === comic.slug;
  const errorId = `add-to-cart-error-${comic.slug}`;
  const disabled = !comic.stock.inStock || addLine.isPending;

  return (
    <div className={`add-to-cart add-to-cart--${variant}`}>
      <button
        type="button"
        disabled={disabled}
        aria-describedby={addLine.isError ? errorId : undefined}
        data-testid={`add-to-cart--${comic.slug}`}
        onClick={() => addLine.mutate({ comicSlug: comic.slug, quantity: 1 })}
      >
        {!comic.stock.inStock
          ? t("cart.addUnavailable")
          : isCurrentComicPending
            ? t("cart.addPending")
            : t("cart.addAction")}
      </button>
      {addLine.isError ? (
        <p id={errorId} className="cart-inline-error" role="alert">
          {t("cart.addError")}
        </p>
      ) : null}
    </div>
  );
}
