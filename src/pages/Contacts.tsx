import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const contacts = [
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
  {
    "id": "2",
    "firstName": "John",
    "lastName": "Smith",
    "username": "john_smith",
    "avatar": "https://i.pravatar.cc/150?img=12",
    "email": "john.smith@example.com",
    "phone": "+1 555-5678",
    "favorite": true
  }
];

const ContactsPage = () => {
  return (
    <div className="h-screen grid grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <div className="border-r p-4 flex flex-col gap-4">
        <Button className="w-full" variant="secondary" asChild>
          <a href="/contacts/new">
            New
          </a>
        </Button>
        <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 mt-4">
          {contacts.map(contact => (
            <Button
              key={contact.id}
              className="justify-start"
              asChild
            >
              <a href={`/contacts/${contact.id}`}>
                {contact.firstName} {contact.lastName}
              </a>
            </Button>
          ))}
        </div>
      </ScrollArea>
      </div>
      {/* Detail View */}
      <div className="p-8">
        Contact page
      </div>
    </div>
  );
};

export default ContactsPage;
