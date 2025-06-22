import { createRoutesStub } from "react-router";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ContactsPage from "@/pages/Contacts";
import ContactDetail from "@/pages/ContactDetail";
import { Contact } from "@/api/contacts";
import ContactsSkeletonPage from "@/Layouts/HomeSkeleton";

test("Render detail page", async () => {
  const Stub = createRoutesStub([
    {
      path: "/",
      id: "root",
      Component: ContactsPage,
      HydrateFallback: ContactsSkeletonPage,
      loader() {
        const contacts: Contact[] = [
            {
              "id": "1",
              "firstName": "Jane",
              "lastName": "Doe",
              "username": "jane_doe",
              "avatar": "https://i.pravatar.cc/150?img=1",
              "email": "jane.doe@example.com",
              "phone": "+1 555-1234",
              "favorite": true
            },
          ];
        return { contacts };
      },
      children: [
        {
        path: "contacts/:contactId",
        Component: ContactDetail,
        }
      ],
    },
  ]);

  // render the app stub at "/login"
  render(<Stub initialEntries={["/contacts/1"]} />);
  // wait for the contact detail to load
  await waitFor(() => screen.findByText('jane_doe'));
});
