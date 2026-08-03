import { type FormEvent, type ReactNode, useId, useState } from "react";
import type { ZodIssue } from "zod";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isAppLocale } from "../../../i18n/locales";
import { useRouteTitle } from "../../../routing/useRouteTitle";
import { useCurrentUserQuery } from "../../auth/api/auth.queries";
import { useCartQuery } from "../../cart/api/cart.queries";
import { formatMoney } from "../../catalog/components/PriceDisplay";
import {
  checkoutRequestSchema,
  type CheckoutAddressRequest,
} from "../api/checkout.contract";
import { isCheckoutApiError } from "../api/checkout.errors";
import { useCheckoutMutation } from "../api/checkout.queries";

interface CheckoutFormState {
  recipientName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: "US" | "PL" | "GB";
}

type CheckoutFormErrors = Partial<Record<keyof CheckoutFormState, string>>;

const initialForm: CheckoutFormState = {
  recipientName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  countryCode: "US",
};

export function CheckoutRoute() {
  const { locale } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formErrorId = useId();
  const countryId = useId();
  const [form, setForm] = useState<CheckoutFormState>(initialForm);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});

  useRouteTitle("checkout.title");

  if (!isAppLocale(locale)) {
    throw new Error("Checkout route rendered without a supported locale.");
  }

  const currentUser = useCurrentUserQuery();
  const isBuyer = currentUser.data?.role === "USER";
  const cartQuery = useCartQuery(locale, Boolean(isBuyer));
  const checkout = useCheckoutMutation(locale);

  if (currentUser.isPending) {
    return (
      <CheckoutShell ariaBusy>
        <p className="route-status" data-testid="checkout-auth-loading" role="status">
          {t("auth.statusLoading")}
        </p>
      </CheckoutShell>
    );
  }

  if (!currentUser.data) {
    return (
      <CheckoutShell>
        <div className="route-status cart-empty" data-testid="checkout-sign-in-required" role="status">
          <strong>{t("checkout.signInTitle")}</strong>
          <span>{t("checkout.signInMessage")}</span>
          <Link className="text-link" to={`/${locale}/login`}>
            {t("auth.loginLink")}
          </Link>
        </div>
      </CheckoutShell>
    );
  }

  if (!isBuyer) {
    return (
      <CheckoutShell>
        <div className="route-status route-status--error" data-testid="checkout-forbidden" role="alert">
          <strong>{t("checkout.forbiddenTitle")}</strong>
          <span>{t("checkout.forbiddenMessage")}</span>
        </div>
      </CheckoutShell>
    );
  }

  const cart = cartQuery.data?.data.cart;
  const formError = checkoutErrorMessage(checkout.error);

  function updateField<K extends keyof CheckoutFormState>(
    field: K,
    value: CheckoutFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = checkoutRequestSchema.safeParse({
      address: toCheckoutAddress(form),
    });

    if (!parsed.success) {
      setErrors(toFormErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    checkout.mutate(parsed.data, {
      onSuccess: (response) => {
        void navigate(`/${locale}/orders/${response.data.order.orderNumber}`);
      },
    });
  }

  return (
    <CheckoutShell ariaBusy={cartQuery.isPending || cartQuery.isFetching}>
      {cartQuery.isPending ? (
        <p className="route-status" data-testid="checkout-cart-loading" role="status">
          {t("checkout.loading")}
        </p>
      ) : null}

      {cartQuery.isError ? (
        <div className="route-status route-status--error" data-testid="checkout-cart-error" role="alert">
          <strong>{t("checkout.errorTitle")}</strong>
          <span>{t("checkout.errorMessage")}</span>
          <button type="button" onClick={() => void cartQuery.refetch()}>
            {t("actions.retry")}
          </button>
        </div>
      ) : null}

      {cart && cart.items.length === 0 ? (
        <div className="route-status cart-empty" data-testid="checkout-empty-cart" role="status">
          <strong>{t("checkout.emptyTitle")}</strong>
          <span>{t("checkout.emptyMessage")}</span>
          <Link className="text-link" to={`/${locale}/cart`}>
            {t("cart.title")}
          </Link>
        </div>
      ) : null}

      {cart && cart.items.length > 0 ? (
        <div className="checkout-layout" data-testid="checkout-ready">
          <section className="checkout-summary" aria-label={t("checkout.summaryLabel")}>
            <h2>{t("checkout.summaryTitle")}</h2>
            <ul>
              {cart.items.map((item) => (
                <li key={item.comicSlug} data-testid={`checkout-item--${item.comicSlug}`}>
                  <span>{item.title}</span>
                  <span>{item.quantity}</span>
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
            <div className="checkout-summary__total">
              <span>{t("cart.totalItems", { count: cart.totalItems })}</span>
              <strong>
                {formatMoney(
                  cart.subtotal.amountMinor,
                  cart.subtotal.currencyCode,
                  locale,
                )}
              </strong>
            </div>
          </section>

          <form className="checkout-form" onSubmit={submit} noValidate>
            {formError ? (
              <div
                className="route-status route-status--error"
                id={formErrorId}
                role="alert"
              >
                <strong>{formError}</strong>
              </div>
            ) : null}

            <TextField
              label={t("checkout.recipientName")}
              name="recipientName"
              value={form.recipientName}
              error={errors.recipientName}
              onChange={(value) => updateField("recipientName", value)}
            />
            <TextField
              label={t("checkout.addressLine1")}
              name="addressLine1"
              value={form.addressLine1}
              error={errors.addressLine1}
              onChange={(value) => updateField("addressLine1", value)}
            />
            <TextField
              label={t("checkout.addressLine2")}
              name="addressLine2"
              value={form.addressLine2}
              error={errors.addressLine2}
              onChange={(value) => updateField("addressLine2", value)}
            />
            <div className="checkout-form__row">
              <TextField
                label={t("checkout.city")}
                name="city"
                value={form.city}
                error={errors.city}
                onChange={(value) => updateField("city", value)}
              />
              <TextField
                label={t("checkout.region")}
                name="region"
                value={form.region}
                error={errors.region}
                onChange={(value) => updateField("region", value)}
              />
            </div>
            <div className="checkout-form__row">
              <TextField
                label={t("checkout.postalCode")}
                name="postalCode"
                value={form.postalCode}
                error={errors.postalCode}
                onChange={(value) => updateField("postalCode", value)}
              />
              <label htmlFor={countryId}>
                <span>{t("checkout.countryCode")}</span>
                <select
                  id={countryId}
                  name="countryCode"
                  value={form.countryCode}
                  onChange={(event) =>
                    updateField(
                      "countryCode",
                      event.target.value as CheckoutFormState["countryCode"],
                    )
                  }
                  aria-invalid={Boolean(errors.countryCode)}
                  aria-describedby={errors.countryCode ? `${countryId}-error` : undefined}
                >
                  <option value="US">{t("checkout.countries.US")}</option>
                  <option value="PL">{t("checkout.countries.PL")}</option>
                  <option value="GB">{t("checkout.countries.GB")}</option>
                </select>
              </label>
              {errors.countryCode ? (
                <span className="auth-form__field-error" id={`${countryId}-error`}>
                  {errors.countryCode}
                </span>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={checkout.isPending}
              aria-describedby={formError ? formErrorId : undefined}
            >
              {checkout.isPending
                ? t("checkout.submitPending")
                : t("checkout.submitAction")}
            </button>
          </form>
        </div>
      ) : null}
    </CheckoutShell>
  );

  function checkoutErrorMessage(error: unknown): string | null {
    if (!error) {
      return null;
    }

    if (isCheckoutApiError(error)) {
      if (error.code === "CART_EMPTY") {
        return t("checkout.emptyTitle");
      }

      if (error.code === "INSUFFICIENT_STOCK") {
        return t("checkout.stockError");
      }

      if (error.code === "CHECKOUT_CONFLICT") {
        return t("checkout.conflictError");
      }

      if (error.code === "CSRF_TOKEN_INVALID") {
        return t("checkout.csrfError");
      }
    }

    return t("checkout.submitError");
  }

  function toFormErrors(issues: ZodIssue[]): CheckoutFormErrors {
    const nextErrors: CheckoutFormErrors = {};

    for (const issue of issues) {
      const field = issue.path.at(-1);
      if (typeof field === "string" && field in form) {
        nextErrors[field as keyof CheckoutFormState] =
          field === "countryCode"
            ? t("checkout.countryInvalid")
            : t("checkout.fieldInvalid");
      }
    }

    return nextErrors;
  }
}

function CheckoutShell({
  ariaBusy = false,
  children,
}: {
  ariaBusy?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <section
      className="checkout-route"
      aria-labelledby="checkout-title"
      aria-busy={ariaBusy}
    >
      <div className="catalog-page__header">
        <p className="eyebrow">{t("checkout.eyebrow")}</p>
        <h1 id="checkout-title">{t("checkout.title")}</h1>
        <p className="intro">{t("checkout.introduction")}</p>
      </div>
      {children}
    </section>
  );
}

function TextField({
  error,
  label,
  name,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  name: keyof CheckoutFormState;
  onChange: (value: string) => void;
  value: string;
}) {
  const id = useId();

  return (
    <>
      <label htmlFor={id}>
        <span>{label}</span>
        <input
          id={id}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </label>
      {error ? (
        <span className="auth-form__field-error" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </>
  );
}

function toCheckoutAddress(
  form: CheckoutFormState,
): CheckoutAddressRequest {
  const address: CheckoutAddressRequest = {
    recipientName: form.recipientName,
    addressLine1: form.addressLine1,
    city: form.city,
    postalCode: form.postalCode,
    countryCode: form.countryCode,
  };

  if (form.addressLine2.trim()) {
    address.addressLine2 = form.addressLine2;
  }

  if (form.region.trim()) {
    address.region = form.region;
  }

  return address;
}
