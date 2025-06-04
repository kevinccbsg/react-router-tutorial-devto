import { useParams, useRouteLoaderData } from "react-router";
import { loadContacts } from "./loader";

const ContactDetail = () => {
  const { contactId } = useParams<{ contactId: string }>(); // Needs TS type annotation
  const routeData = useRouteLoaderData<typeof loadContacts>("root");
  if (!routeData) {
    return <div>Loading...</div>;
  }

  const { contacts } = routeData;
  
  // Find the contact locally (outside the store)
  const contact = contacts.find((c) => c.id === contactId);

  if (!contact) {
    return <div>Contact not found</div>;
  }
  return (
    <div>
      <h2>Contact Detail</h2>
      <p>{contact.firstName}</p>
      <p>{contact.username}</p>
    </div>
  );
}

export default ContactDetail;
