import { useLoaderData } from "react-router";
import { loadContactDetail } from "./loader";

const ContactDetail = () => {
  const { contact } = useLoaderData<typeof loadContactDetail>();
  return (
    <div>
      <h2>Contact Detail</h2>
      <p>{contact.firstName}</p>
      <p>{contact.username}</p>
    </div>
  );
}

export default ContactDetail;
