import { createBrowserRouter } from "react-router";
import ContactsPage from "./pages/Contacts";
import ContactForm from "./pages/ContactForm";
import loadContacts from "./pages/loader";
import ContactsSkeletonPage from "./Layouts/HomeSkeleton";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    loader: loadContacts,
    HydrateFallback: ContactsSkeletonPage,
    Component: ContactsPage,
    children: [
      {
        path: "contacts/new",
        Component: ContactForm,
      },
    ],
  },
  {
    path: "/about",
    element: <div>About</div>,
  },
  {
    path: "*",
    element: <div>Not Found</div>,
  },
]);

export default AppRoutes;
