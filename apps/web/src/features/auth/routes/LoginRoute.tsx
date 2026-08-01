import { type FormEvent, useId, useState } from "react";
import type { ZodIssue } from "zod";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isAppLocale, type AppLocale } from "../../../i18n/locales";
import { useRouteTitle } from "../../../routing/useRouteTitle";
import { loginRequestSchema } from "../api/auth.contract";
import { isAuthApiError } from "../api/auth.errors";
import { useLoginMutation } from "../api/auth.queries";

interface LoginFormErrors {
  email?: string;
  password?: string;
}

export function LoginRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locale: rawLocale } = useParams();
  const locale: AppLocale = isAppLocale(rawLocale) ? rawLocale : "en";
  const login = useLoginMutation();
  const emailId = useId();
  const passwordId = useId();
  const formErrorId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({});

  useRouteTitle("auth.loginTitle");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginRequestSchema.safeParse({ email, password });

    if (!parsed.success) {
      setErrors(toLoginFormErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    login.mutate(parsed.data, {
      onSuccess: () => {
        void navigate(`/${locale}/comics`);
      },
    });
  }

  const formError = authErrorMessage(login.error);

  return (
    <section className="auth-page" data-testid="login-route">
      <p className="eyebrow">{t("auth.eyebrow")}</p>
      <h1>{t("auth.loginTitle")}</h1>
      <p className="intro">{t("auth.loginIntro")}</p>

      <form className="auth-form" onSubmit={submit} noValidate>
        {formError ? (
          <div
            className="route-status route-status--error"
            id={formErrorId}
            role="alert"
          >
            <strong>{formError}</strong>
          </div>
        ) : null}

        <label htmlFor={emailId}>
          <span>{t("auth.emailLabel")}</span>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
          />
        </label>
        {errors.email ? (
          <p className="auth-form__field-error" id={`${emailId}-error`}>
            {errors.email}
          </p>
        ) : null}

        <label htmlFor={passwordId}>
          <span>{t("auth.passwordLabel")}</span>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? `${passwordId}-error` : undefined
            }
          />
        </label>
        {errors.password ? (
          <p className="auth-form__field-error" id={`${passwordId}-error`}>
            {errors.password}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={login.isPending}
          aria-describedby={formError ? formErrorId : undefined}
        >
          {login.isPending ? t("auth.loginPending") : t("auth.loginAction")}
        </button>
      </form>

      <p className="auth-demo-note">{t("auth.demoNote")}</p>
      <Link className="text-link" to={`/${locale}/comics`}>
        {t("actions.backToCatalog")}
      </Link>
    </section>
  );

  function authErrorMessage(error: unknown): string | null {
    if (!error) {
      return null;
    }

    if (isAuthApiError(error)) {
      if (error.code === "INVALID_CREDENTIALS") {
        return t("auth.invalidCredentials");
      }

      if (error.code === "AUTH_RATE_LIMITED") {
        return t("auth.rateLimited");
      }
    }

    return t("auth.unexpectedError");
  }

  function toLoginFormErrors(issues: ZodIssue[]): LoginFormErrors {
    const nextErrors: LoginFormErrors = {};

    for (const issue of issues) {
      const path = String(issue.path[0] ?? "");

      if (path === "email") {
        nextErrors.email =
          issue.code === "too_big"
            ? t("auth.emailTooLong")
            : t("auth.emailInvalid");
      }

      if (path === "password") {
        nextErrors.password =
          issue.code === "too_big"
            ? t("auth.passwordTooLong")
            : t("auth.passwordRequired");
      }
    }

    return nextErrors;
  }
}
