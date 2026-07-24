import {
  Navigate,
  createBrowserRouter,
  type RouteObject,
  useParams,
} from "react-router-dom";
import { CatalogListRoute } from "../features/catalog/routes/CatalogListRoute";
import { ComicDetailRoute } from "../features/catalog/routes/ComicDetailRoute";
import { LocaleRoute } from "../routing/LocaleRoute";
import { NotFoundRoute } from "../routing/NotFoundRoute";
import { RouteErrorBoundary } from "../routing/RouteErrorBoundary";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/en/comics" replace />,
    errorElement: <RouteErrorBoundary standalone />,
  },
  {
    path: "/:locale",
    element: <LocaleRoute />,
    errorElement: <RouteErrorBoundary standalone />,
    children: [
      {
        index: true,
        element: <LocaleCatalogRedirect />,
      },
      {
        path: "comics",
        element: <CatalogListRoute />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "comics/:slug",
        element: <ComicDetailRoute />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "*",
        element: <NotFoundRoute />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundRoute standalone />,
    errorElement: <RouteErrorBoundary standalone />,
  },
];

function LocaleCatalogRedirect() {
  const { locale } = useParams();
  return <Navigate to={`/${locale ?? "en"}/comics`} replace />;
}

export function createAppBrowserRouter() {
  return createBrowserRouter(appRoutes);
}
