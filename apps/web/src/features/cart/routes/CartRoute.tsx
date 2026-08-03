import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAppLocale } from "../../../i18n/locales";
import { useRouteTitle } from "../../../routing/useRouteTitle";
import { useCurrentUserQuery } from "../../auth/api/auth.queries";
import { CatalogCover } from "../../catalog/components/CatalogCover";
import { formatMoney, PriceDisplay } from "../../catalog/components/PriceDisplay";
import { StockStatus } from "../../catalog/components/StockStatus";
import type { CartItem } from "../api/cart.contract";
import { isCartApiError } from "../api/cart.errors";
import {
  useCartQuery,
  useRemoveCartLineMutation,
  useUpdateCartLineMutation,
} from "../api/cart.queries";

export function CartRoute() {
  const { locale } = useParams();
  const { t } = useTranslation();
  useRouteTitle("cart.title");

  if (!isAppLocale(locale)) {
    throw new Error("Cart route rendered without a supported locale.");
  }

  const currentUser = useCurrentUserQuery();
  const isBuyer = currentUser.data?.role === "USER";
  const cartQuery = useCartQuery(locale, Boolean(isBuyer));
  const isForbidden =
    cartQuery.isError &&
    isCartApiError(cartQuery.error) &&
    cartQuery.error.status === 403;

  if (currentUser.isPending) {
    return (
      <CartShell ariaBusy>
        <p className="route-status" data-testid="cart-auth-loading" role="status">
          {t("auth.statusLoading")}
        </p>
      </CartShell>
    );
  }

  if (!currentUser.data) {
    return (
      <CartShell>
        <div className="route-status cart-empty" data-testid="cart-sign-in-required" role="status">
          <strong>{t("cart.signInTitle")}</strong>
          <span>{t("cart.signInMessage")}</span>
          <Link className="text-link" to={`/${locale}/login`}>
            {t("auth.loginLink")}
          </Link>
        </div>
      </CartShell>
    );
  }

  if (!isBuyer) {
    return (
      <CartShell>
        <div className="route-status route-status--error" data-testid="cart-forbidden" role="alert">
          <strong>{t("cart.forbiddenTitle")}</strong>
          <span>{t("cart.forbiddenMessage")}</span>
        </div>
      </CartShell>
    );
  }

  return (
    <CartShell ariaBusy={cartQuery.isPending || cartQuery.isFetching}>
      {cartQuery.isPending ? (
        <p className="route-status" data-testid="cart-loading" role="status">
          {t("cart.loading")}
        </p>
      ) : null}

      {cartQuery.isError ? (
        <div
          className="route-status route-status--error"
          data-testid={isForbidden ? "cart-forbidden" : "cart-error"}
          role="alert"
        >
          <strong>
            {isForbidden ? t("cart.forbiddenTitle") : t("cart.errorTitle")}
          </strong>
          <span>
            {isForbidden ? t("cart.forbiddenMessage") : t("cart.errorMessage")}
          </span>
          {!isForbidden ? (
            <button type="button" onClick={() => void cartQuery.refetch()}>
              {t("actions.retry")}
            </button>
          ) : null}
        </div>
      ) : null}

      {cartQuery.data && cartQuery.data.data.cart.items.length === 0 ? (
        <div className="route-status cart-empty" data-testid="cart-empty" role="status">
          <strong>{t("cart.emptyTitle")}</strong>
          <span>{t("cart.emptyMessage")}</span>
          <Link className="text-link" to={`/${locale}/comics`}>
            {t("actions.backToCatalog")}
          </Link>
        </div>
      ) : null}

      {cartQuery.data && cartQuery.data.data.cart.items.length > 0 ? (
        <section className="cart-panel" data-testid="cart-populated">
          <ul className="cart-items" data-testid="cart-items">
            {cartQuery.data.data.cart.items.map((item) => (
              <CartLineItem key={item.comicSlug} item={item} locale={locale} />
            ))}
          </ul>
          <div className="cart-summary" aria-label={t("cart.summaryLabel")}>
            <div>
              <span>{t("cart.totalItems", { count: cartQuery.data.data.cart.totalItems })}</span>
              <strong>
                {formatMoney(
                  cartQuery.data.data.cart.subtotal.amountMinor,
                  cartQuery.data.data.cart.subtotal.currencyCode,
                  locale,
                )}
              </strong>
            </div>
            <Link className="cart-summary__checkout" to={`/${locale}/checkout`}>
              {t("cart.checkoutAction")}
            </Link>
          </div>
        </section>
      ) : null}
    </CartShell>
  );
}

function CartShell({
  ariaBusy = false,
  children,
}: {
  ariaBusy?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <section
      className="cart-route"
      aria-labelledby="cart-title"
      aria-busy={ariaBusy}
    >
      <div className="catalog-page__header">
        <p className="eyebrow">{t("cart.eyebrow")}</p>
        <h1 id="cart-title">{t("cart.title")}</h1>
        <p className="intro">{t("cart.introduction")}</p>
      </div>
      {children}
    </section>
  );
}

function CartLineItem({
  item,
  locale,
}: {
  item: CartItem;
  locale: "en" | "ru";
}) {
  const { t } = useTranslation();
  const updateLine = useUpdateCartLineMutation();
  const removeLine = useRemoveCartLineMutation();
  const pending =
    (updateLine.isPending && updateLine.variables?.comicSlug === item.comicSlug) ||
    (removeLine.isPending && removeLine.variables === item.comicSlug);
  const error =
    updateLine.isError && updateLine.variables?.comicSlug === item.comicSlug
      ? updateLine.error
      : removeLine.isError && removeLine.variables === item.comicSlug
        ? removeLine.error
        : null;

  return (
    <li className="cart-item" data-testid={`cart-item--${item.comicSlug}`}>
      <CatalogCover
        alt={t("catalog.coverAlt", { title: item.title })}
        coverPath={item.coverPath}
        variant="card"
      />
      <div className="cart-item__body">
        <h2>{item.title}</h2>
        <p className="comic-detail__sku">
          <span>{t("catalog.skuLabel")}</span> {item.sku}
        </p>
        <StockStatus
          inStock={item.stock.inStock}
          quantity={item.stock.quantity}
        />
        <PriceDisplay
          amountMinor={item.unitPrice.amountMinor}
          compareAtPrice={null}
          currencyCode={item.unitPrice.currencyCode}
          locale={locale}
        />
      </div>
      <div className="cart-item__controls">
        <label>
          <span>{t("cart.quantityLabel", { title: item.title })}</span>
          <input
            type="number"
            min={1}
            max={99}
            value={item.quantity}
            disabled={pending}
            onChange={(event) => {
              const quantity = Number(event.currentTarget.value);
              if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 99) {
                updateLine.mutate({
                  comicSlug: item.comicSlug,
                  quantity,
                });
              }
            }}
          />
        </label>
        <span className="cart-item__line-total">
          {formatMoney(
            item.lineTotal.amountMinor,
            item.lineTotal.currencyCode,
            locale,
          )}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => removeLine.mutate(item.comicSlug)}
        >
          {pending ? t("cart.updating") : t("cart.removeAction")}
        </button>
        {error ? (
          <p className="cart-inline-error" role="alert">
            {t("cart.updateError")}
          </p>
        ) : null}
      </div>
    </li>
  );
}
