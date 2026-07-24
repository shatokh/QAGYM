import { Component, type ErrorInfo, type ReactNode } from "react";
import { i18n } from "../i18n/i18n";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled frontend render error.", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="standalone-state" id="main-content">
          <div className="route-state route-state--error" role="alert">
            <p className="eyebrow">{i18n.t("app.brand")}</p>
            <h1>{i18n.t("errors.unexpectedTitle")}</h1>
            <p>{i18n.t("errors.unexpectedMessage")}</p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
