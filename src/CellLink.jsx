import { Navigate, Outlet, useRoutes } from "react-router";
import Layout from "./Layout";
import Library from "./function/Library";
import Overview from "./function/Overview";
import InternalQA from "./function/InternalQA";
import AI from "./function/AI";

import Login from "./Login/Login";

import LibraryDetail from "./function/Library/LibraryDetail";

export default function CellLink() {
  const getAuth = () => {
    const localAuth = localStorage.getItem("pwc_auth");
    const sessionAuth = sessionStorage.getItem("pwc_auth");
    return localAuth === "true" || sessionAuth === "true";
  };

  function ProtectedRoute() {
    return getAuth() ? <Outlet /> : <Navigate to="/Login" replace />;
  }

  function PublicOnlyRoute() {
    return getAuth() ? <Navigate to="/Overview" replace /> : <Outlet />;
  }

  const render = useRoutes([
    {
      element: <PublicOnlyRoute />,
      children: [{ path: "/Login", element: <Login /> }],
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/",
          element: <Layout />,
          children: [
            { index: true, element: <Overview /> },
            { path: "Overview", element: <Overview /> },
            { path: "Library", element: <Library /> },
            { path: "Library/:deviceId", element: <LibraryDetail /> },
            { path: "QA", element: <InternalQA /> },
            { path: "AI", element: <AI /> },
          ],
        },
      ],
    },
    {
      path: "*",
      element: <Navigate to="/Overview" replace />,
    },
  ]);

  return render;
}
