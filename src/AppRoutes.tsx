import { createBrowserRouter } from "react-router";
import ContactsPage from "./pages/Contacts";
import ContactForm from "./pages/ContactForm";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
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
