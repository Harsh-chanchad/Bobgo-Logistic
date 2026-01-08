import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import NotFound from "./pages/NotFound";
import { Configuration } from "./pages/Configuration";

const router = createBrowserRouter([
  {
    path: "/company/:company_id/",
    element: <App />,
  },
  {
    path: "/company/:company_id/application/:application_id",
    element: <App />,
  },
  {
    path: "/company/:company_id/configuration",
    element: <Configuration />,
  },
  {
    path: "/configuration",
    element: <Configuration />,
  },
  {
    path: '/admin',
    element: <div>Hello Admin panel</div>
  },
  {
    path: "/*", // Fallback route for all unmatched paths
    element: <NotFound />, // Component to render for unmatched paths
  },
]);

export default router;
