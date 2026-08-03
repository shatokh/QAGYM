import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAppLocale } from "../../../i18n/locales";
import { useRouteTitle } from "../../../routing/useRouteTitle";
import { useCurrentUserQuery } from "../../auth/api/auth.queries";
import { formatMoney } from "../../catalog/components/PriceDisplay";
import { isCheckoutApiError } from "../api/checkout.errors";
import { useOrderDetailQuery } from "../api/checkout.queries";
import { formatOrderDate } from "../order-formatting";

export function OrderDetailRoute() {
  const { locale, orderNumber } = useParams();
  const { t } = useTranslation();

  useRouteTitle("orders.detailTitle", orderNumber);

  if (!isAppLocale(locale) || !orderNumber) {
    throw new Error("Order detail route rendered without valid parameters.");
  }

  const currentUser = useCurrentUserQuery();
  const isBuyer = currentUser.data?.role === "USER";
  const orderQuery = useOrderDetailQuery(orderNumber, Boolean(isBuyer));
  const isNotFound =
    orderQuery.isError &&
    isCheckoutApiError(orderQuery.error) &&
    (orderQuery.error.status === 404 || orderQuery.error.status === 400);

  if (currentUser.isPending) {
    return (
      <OrderDetailShell ariaBusy orderNumber={orderNumber}>
        <p className="route-status" data-testid="order-auth-loading" role="status">
          {t("auth.statusLoading")}
        </p>
      </OrderDetailShell>
    );
  }

  if (!currentUser.data) {
    return (
      <OrderDetailShell orderNumber={orderNumber}>
        <div className="route-status cart-empty" data-testid="order-sign-in-required" role="status">
          <strong>{t("orders.signInTitle")}</strong>
          <span>{t("orders.signInMessage")}</span>
          <Link className="text-link" to={`/${locale}/login`}>
            {t("auth.loginLink")}
          </Link>
        </div>
      </OrderDetailShell>
    );
  }

  if (!isBuyer) {
    return (
      <OrderDetailShell orderNumber={orderNumber}>
        <div className="route-status route-status--error" data-testid="order-forbidden" role="alert">
          <strong>{t("orders.forbiddenTitle")}</strong>
          <span>{t("orders.forbiddenMessage")}</span>
        </div>
      </OrderDetailShell>
    );
  }

  return (
    <OrderDetailShell
      ariaBusy={orderQuery.isPending || orderQuery.isFetching}
      orderNumber={orderNumber}
    >
      {orderQuery.isPending ? (
        <p className="route-status" data-testid="order-loading" role="status">
          {t("orders.detailLoading")}
        </p>
      ) : null}

      {isNotFound ? (
        <div className="route-status route-status--error" data-testid="order-not-found" role="alert">
          <strong>{t("orders.notFoundTitle")}</strong>
          <span>{t("orders.notFoundMessage")}</span>
          <Link className="text-link" to={`/${locale}/orders`}>
            {t("orders.title")}
          </Link>
        </div>
      ) : null}

      {orderQuery.isError && !isNotFound ? (
        <div className="route-status route-status--error" data-testid="order-error" role="alert">
          <strong>{t("orders.detailErrorTitle")}</strong>
          <span>{t("orders.detailErrorMessage")}</span>
          <button type="button" onClick={() => void orderQuery.refetch()}>
            {t("actions.retry")}
          </button>
        </div>
      ) : null}

      {orderQuery.data ? (
        <article
          className="order-detail"
          data-testid={`order-detail--${orderQuery.data.data.order.orderNumber}`}
        >
          <dl className="order-detail__summary">
            <div>
              <dt>{t("orders.statusLabel")}</dt>
              <dd>{t(`orders.status.${orderQuery.data.data.order.status}`)}</dd>
            </div>
            <div>
              <dt>{t("orders.createdAt")}</dt>
              <dd>
                {formatOrderDate(orderQuery.data.data.order.createdAt, locale)}
              </dd>
            </div>
            <div>
              <dt>{t("orders.items")}</dt>
              <dd>
                {t("cart.totalItems", {
                  count: orderQuery.data.data.order.totalItems,
                })}
              </dd>
            </div>
            <div>
              <dt>{t("orders.total")}</dt>
              <dd>
                {formatMoney(
                  orderQuery.data.data.order.total.amountMinor,
                  orderQuery.data.data.order.total.currencyCode,
                  locale,
                )}
              </dd>
            </div>
          </dl>

          <section className="order-detail__section" aria-labelledby="order-lines-title">
            <h2 id="order-lines-title">{t("orders.linesTitle")}</h2>
            <ul className="order-lines">
              {orderQuery.data.data.order.items.map((item) => (
                <li key={item.comicSlug} data-testid={`order-line--${item.comicSlug}`}>
                  <span>{item.title}</span>
                  <span>{item.sku}</span>
                  <span>{item.quantity}</span>
                  <span>
                    {formatMoney(
                      item.unitPrice.amountMinor,
                      item.unitPrice.currencyCode,
                      locale,
                    )}
                  </span>
                  <strong>
                    {formatMoney(
                      item.lineTotal.amountMinor,
                      item.lineTotal.currencyCode,
                      locale,
                    )}
                  </strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="order-detail__section" aria-labelledby="order-address-title">
            <h2 id="order-address-title">{t("orders.addressTitle")}</h2>
            <address>
              <span>{orderQuery.data.data.order.address.recipientName}</span>
              <span>{orderQuery.data.data.order.address.addressLine1}</span>
              {orderQuery.data.data.order.address.addressLine2 ? (
                <span>{orderQuery.data.data.order.address.addressLine2}</span>
              ) : null}
              <span>
                {[
                  orderQuery.data.data.order.address.city,
                  orderQuery.data.data.order.address.region,
                  orderQuery.data.data.order.address.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
              <span>{orderQuery.data.data.order.address.countryCode}</span>
            </address>
          </section>

          <Link className="text-link" to={`/${locale}/orders`}>
            {t("orders.backToOrders")}
          </Link>
        </article>
      ) : null}
    </OrderDetailShell>
  );
}

function OrderDetailShell({
  ariaBusy = false,
  children,
  orderNumber,
}: {
  ariaBusy?: boolean;
  children: ReactNode;
  orderNumber: string;
}) {
  const { t } = useTranslation();

  return (
    <section
      className="orders-route"
      aria-labelledby="order-detail-title"
      aria-busy={ariaBusy}
    >
      <div className="catalog-page__header">
        <p className="eyebrow">{t("orders.eyebrow")}</p>
        <h1 id="order-detail-title">{orderNumber}</h1>
        <p className="intro">{t("orders.detailIntroduction")}</p>
      </div>
      {children}
    </section>
  );
}
