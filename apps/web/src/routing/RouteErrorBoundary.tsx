import { useTranslation } from "react-i18next";
import { useRouteError } from "react-router-dom";
import { useRouteTitle } from "./useRouteTitle";

interface RouteErrorBoundaryProps {
  standalone?: boolean;
}

export function RouteErrorBoundary({
  standalone = false,
}: RouteErrorBoundaryProps) {
  const { t } = useTranslation();
  useRouteError();
  useRouteTitle("errors.unexpectedTitle");

  const content = (
    <section
      className="route-state route-state--error"
      data-testid="route-error"
      role="alert"
    >
      <h1>{t("errors.unexpectedTitle")}</h1>
      <p>{t("errors.unexpectedMessage")}</p>
    </section>
  );

  if (standalone) {
    return (
      <main className="standalone-state" id="main-content">
        {content}
      </main>
    );
  }

  return content;
}
