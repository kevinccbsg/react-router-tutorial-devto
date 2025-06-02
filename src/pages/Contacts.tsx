import { Link, Outlet, useLoaderData } from "react-router";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import loadContacts from "./loader";

const ContactsPage = () => {
  const { contacts } = useLoaderData<typeof loadContacts>();
  return (
    <div className="h-screen grid grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <div className="border-r p-4 flex flex-col gap-4">
        <Button className="w-full" variant="secondary" asChild>
          <Link to="/contacts/new" viewTransition>
            New
          </Link>
        </Button>
        <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 mt-4">
          {contacts.map(contact => (
            <Button
              key={contact.id}
              className="justify-start"
              asChild
            >
              <Link to={`/contacts/${contact.id}`} viewTransition>
                {contact.firstName} {contact.lastName}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
      </div>
      {/* Detail View */}
      <div className="p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default ContactsPage;
