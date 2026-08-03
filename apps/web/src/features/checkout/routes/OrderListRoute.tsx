import type { ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAppLocale } from "../../../i18n/locales";
import { useRouteTitle } from "../../../routing/useRouteTitle";
import { useCurrentUserQuery } from "../../auth/api/auth.queries";
import { formatMoney } from "../../catalog/components/PriceDisplay";
import type { OrderSummary } from "../api/checkout.contract";
import { useOrderListQuery } from "../api/checkout.queries";
import { formatOrderDate } from "../order-formatting";

const ORDER_PAGE_SIZE = 12;

export function OrderListRoute() {
  const { locale } = useParams();
  const { t } = useTranslation();
  const location = useLocation();

  useRouteTitle("orders.title");

  if (!isAppLocale(locale)) {
    throw new Error("Order list route rendered without a supported locale.");
  }

  const page = parseOrderPage(location.search);
  const currentUser = useCurrentUserQuery();
  const isBuyer = currentUser.data?.role === "USER";
  const ordersQuery = useOrderListQuery(
    {
      page,
      pageSize: ORDER_PAGE_SIZE,
    },
    Boolean(isBuyer),
  );

  if (currentUser.isPending) {
    return (
      <OrdersShell ariaBusy>
        <p className="route-status" data-testid="orders-auth-loading" role="status">
          {t("auth.statusLoading")}
        </p>
      </OrdersShell>
    );
  }

  if (!currentUser.data) {
    return (
      <OrdersShell>
        <div className="route-status cart-empty" data-testid="orders-sign-in-required" role="status">
          <strong>{t("orders.signInTitle")}</strong>
          <span>{t("orders.signInMessage")}</span>
          <Link className="text-link" to={`/${locale}/login`}>
            {t("auth.loginLink")}
          </Link>
        </div>
      </OrdersShell>
    );
  }

  if (!isBuyer) {
    return (
      <OrdersShell>
        <div className="route-status route-status--error" data-testid="orders-forbidden" role="alert">
          <strong>{t("orders.forbiddenTitle")}</strong>
          <span>{t("orders.forbiddenMessage")}</span>
        </div>
      </OrdersShell>
    );
  }

  return (
    <OrdersShell ariaBusy={ordersQuery.isPending || ordersQuery.isFetching}>
      {ordersQuery.isPending ? (
        <p className="route-status" data-testid="orders-loading" role="status">
          {t("orders.loading")}
        </p>
      ) : null}

      {ordersQuery.isError ? (
        <div className="route-status route-status--error" data-testid="orders-error" role="alert">
          <strong>{t("orders.errorTitle")}</strong>
          <span>{t("orders.errorMessage")}</span>
          <button type="button" onClick={() => void ordersQuery.refetch()}>
            {t("actions.retry")}
          </button>
        </div>
      ) : null}

      {ordersQuery.data && ordersQuery.data.data.length === 0 ? (
        <div className="route-status cart-empty" data-testid="orders-empty" role="status">
          <strong>{t("orders.emptyTitle")}</strong>
          <span>{t("orders.emptyMessage")}</span>
          <Link className="text-link" to={`/${locale}/comics`}>
            {t("actions.backToCatalog")}
          </Link>
        </div>
      ) : null}

      {ordersQuery.data && ordersQuery.data.data.length > 0 ? (
        <>
          <ul className="order-list" data-testid="orders-list">
            {ordersQuery.data.data.map((order) => (
              <OrderListItem key={order.orderNumber} order={order} locale={locale} />
            ))}
          </ul>
          <OrderPagination
            locale={locale}
            page={ordersQuery.data.pagination.page}
            totalPages={ordersQuery.data.pagination.totalPages}
          />
        </>
      ) : null}
    </OrdersShell>
  );
}

function OrdersShell({
  ariaBusy = false,
  children,
}: {
  ariaBusy?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <section
      className="orders-route"
      aria-labelledby="orders-title"
      aria-busy={ariaBusy}
    >
      <div className="catalog-page__header">
        <p className="eyebrow">{t("orders.eyebrow")}</p>
        <h1 id="orders-title">{t("orders.title")}</h1>
        <p className="intro">{t("orders.introduction")}</p>
      </div>
      {children}
    </section>
  );
}

function OrderListItem({
  locale,
  order,
}: {
  locale: "en" | "ru";
  order: OrderSummary;
}) {
  const { t } = useTranslation();

  return (
    <li className="order-card" data-testid={`order-card--${order.orderNumber}`}>
      <div>
        <Link to={`/${locale}/orders/${order.orderNumber}`}>
          {order.orderNumber}
        </Link>
        <span>{t(`orders.status.${order.status}`)}</span>
      </div>
      <dl>
        <div>
          <dt>{t("orders.createdAt")}</dt>
          <dd>{formatOrderDate(order.createdAt, locale)}</dd>
        </div>
        <div>
          <dt>{t("orders.items")}</dt>
          <dd>{t("cart.totalItems", { count: order.totalItems })}</dd>
        </div>
        <div>
          <dt>{t("orders.total")}</dt>
          <dd>
            {formatMoney(
              order.total.amountMinor,
              order.total.currencyCode,
              locale,
            )}
          </dd>
        </div>
      </dl>
    </li>
  );
}

function OrderPagination({
  locale,
  page,
  totalPages,
}: {
  locale: "en" | "ru";
  page: number;
  totalPages: number;
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="catalog-pagination" aria-label={t("orders.paginationLabel")}>
      <Link
        aria-disabled={page <= 1}
        to={`/${locale}/orders?page=${Math.max(1, page - 1)}`}
      >
        {t("catalog.previousPage")}
      </Link>
      <span>{t("catalog.pageStatus", { page, totalPages })}</span>
      <Link
        aria-disabled={page >= totalPages}
        to={`/${locale}/orders?page=${Math.min(totalPages, page + 1)}`}
      >
        {t("catalog.nextPage")}
      </Link>
    </nav>
  );
}

function parseOrderPage(search: string): number {
  const rawPage = new URLSearchParams(search).get("page");
  if (!rawPage || !/^[1-9][0-9]*$/.test(rawPage)) {
    return 1;
  }

  return Number(rawPage);
}
