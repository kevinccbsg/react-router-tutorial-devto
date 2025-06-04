import { createBrowserRouter } from "react-router";
import ContactsPage from "./pages/Contacts";
import ContactForm from "./pages/ContactForm";
import loadContacts, { loadContactDetail } from "./pages/loader";
import ContactsSkeletonPage from "./Layouts/HomeSkeleton";
import ContactDetail from "./pages/ContactDetail";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    loader: loadContacts,
    HydrateFallback: ContactsSkeletonPage,
    Component: ContactsPage,
    children: [
      {
        path: "contacts/:contactId",
        loader: loadContactDetail,
        Component: ContactDetail,
      },
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
