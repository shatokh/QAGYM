import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AppLocale } from "../../../i18n/locales";
import { useCurrentUserQuery, useLogoutMutation } from "../api/auth.queries";
import type { AuthRole } from "../api/auth.contract";

interface AuthShellStatusProps {
  locale: AppLocale;
}

export function AuthShellStatus({ locale }: AuthShellStatusProps) {
  const { t } = useTranslation();
  const currentUser = useCurrentUserQuery();
  const logout = useLogoutMutation();

  if (currentUser.isPending) {
    return (
      <div className="auth-shell" data-testid="auth-shell">
        <span className="auth-shell__muted">{t("auth.statusLoading")}</span>
      </div>
    );
  }

  if (currentUser.isError) {
    return (
      <div className="auth-shell" data-testid="auth-shell">
        <span className="auth-shell__error" role="status">
          {t("auth.statusUnavailable")}
        </span>
        <Link to={`/${locale}/login`}>{t("auth.loginLink")}</Link>
      </div>
    );
  }

  if (!currentUser.data) {
    return (
      <div className="auth-shell" data-testid="auth-shell">
        <Link to={`/${locale}/login`}>{t("auth.loginLink")}</Link>
      </div>
    );
  }

  return (
    <div
      className="auth-shell auth-shell--authenticated"
      data-testid="auth-shell"
    >
      <span>
        {t("auth.signedInAs", {
          name: currentUser.data.displayName,
        })}
      </span>
      <span className="auth-shell__role">
        {t(`auth.roles.${currentUser.data.role as AuthRole}`)}
      </span>
      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        {logout.isPending ? t("auth.logoutPending") : t("auth.logout")}
      </button>
    </div>
  );
}
