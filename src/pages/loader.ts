import { fetchContacts } from "@/api/contacts";

export const loadContacts = async () => {
  const contacts = await fetchContacts();
  return { contacts };
};

export default loadContacts;
