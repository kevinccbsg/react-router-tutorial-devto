import { ActionFunctionArgs, redirect } from "react-router";
import { createContact } from "@/api/contacts";

interface NewContact {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string;
}

export const newContactAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const method = request.method.toUpperCase();
  
  if (method === 'POST') {
    const newContact: NewContact = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      avatar: formData.get('avatar') as string || undefined,
    };
    const newContactResponse = await createContact(newContact);
    return redirect(`/contacts/${newContactResponse.id}`);
  }

  return null;
};