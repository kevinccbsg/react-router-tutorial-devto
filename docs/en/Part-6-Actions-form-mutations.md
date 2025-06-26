We continue with the sixth installment of this series on React Router Data Mode. This time, we'll talk about **actions**: one of the key pieces for data handling that React Router offers.

---

If you're coming from the [previous post](https://dev.to/kevinccbsg/react-router-data-mode-parte-5-refactor-useparams-y-navlink-1bbe), you can continue with your project as is. But if you prefer to start fresh or make sure you're at the exact point, run the following commands:

```bash
# Repository link https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 05-action-create-contact
```

## What is an action?

An **action** is a function that we can associate with a route, and it's responsible for performing **data mutations**. The interesting part is that, once completed, **React Router automatically revalidates the UI data** without us having to handle that process manually.

In our contacts project, we'll start by creating a new contact using an action. You'll see that when you do this, the list updates automatically without needing to write extra logic.

---

## Handling forms

In `src/pages/ContactForm.tsx`, we replace the `<form>` tag with the `<Form>` component from `react-router`, which is responsible for triggering the corresponding action on submit.

It's also important to specify the method (for example, `POST`):

```tsx
<Form className="space-y-4" method="POST">
```

This component will execute the action defined in the corresponding route. To do this, we configure the action in `src/AppRoutes.tsx`.

An example taken from the official documentation would be:

```tsx
import { createBrowserRouter } from "react-router";
import { someApi } from "./api";

let router = createBrowserRouter([
  {
    path: "/projects/:projectId",
    Component: Project,
    action: async ({ request }) => {
      let formData = await request.formData();
      let title = formData.get("title");
      let project = await someApi.updateProject({ title });
      return project;
    },
  },
]);
```

Just like we did with loaders, it's recommended to extract the action to a separate file.

Create `src/pages/actions.tsx` with the following:

```tsx
import { ActionFunctionArgs } from "react-router";

export const newContactAction = async ({ request }: ActionFunctionArgs) => {
  console.log('Calling the action');
  return null;
};
```

This function receives an object with `ActionFunctionArgs`. We'll focus on `request`, although you can also access the route's `params`.

> **Note**: an action must always return something, either null or a redirect (which we'll see later).

In `src/AppRoutes.tsx`, configure the action in the `contacts/new` route like this:

```tsx
{
  path: "contacts/new",
  action: newContactAction,
  Component: ContactForm,
}
```

When you test the form on the web, you should see the `console.log` in your console, indicating that the action executed correctly.

---

## Getting form data

We use `request.formData()` to capture the data, since our inputs are already properly labeled with `name`.

```ts
const formData = await request.formData();
const newContact = {
  firstName: formData.get('firstName') as string,
  lastName: formData.get('lastName') as string,
  username: formData.get('username') as string,
  email: formData.get('email') as string,
  phone: formData.get('phone') as string,
  avatar: formData.get('avatar') as string || undefined,
};
```

Also, we validate that the method is `POST`:

```ts
const method = request.method.toUpperCase();
if (method === 'POST') {
  // create the contact
}
return null;
```
---

## Final action

The complete code for our action would look like this:

```tsx
import { ActionFunctionArgs } from "react-router";
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
    await createContact(newContact);
  }

  return null;
};
```

When you create a new contact, it will automatically appear in the sidebar.

---

## Redirect after creation

Now let's improve the experience by redirecting directly to the new contact's page. We use the `redirect` helper from `react-router` right after creating the contact:

```tsx
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
```

---

## Handling loading state

To manage the form state while it's submitting or loading, we use the `useNavigation` hook provided by React Router. This hook gives us information about the current navigation, and we use it to know if we're submitting the form or waiting for the UI to update after the `redirect`.

```tsx
const navigation = useNavigation();
```

With this, we have access to the current navigation state, which can be `"idle"`, `"submitting"`, or `"loading"`.

Then we create two variables to detect if we're submitting this particular form (not any other) or if we're waiting for the view to reload after completion:

```tsx
const isSubmitting = navigation.state === 'submitting' && navigation.formAction === '/contacts/new';
const isLoading = navigation.state === 'loading' && navigation.formAction === '/contacts/new';
```

This is important because there may be other routes or forms in the app, and we don't want to disable the button if it's not this form being used.

Finally, we combine both states to know if the button should be disabled:

```tsx
const disabled = isSubmitting || isLoading;
```

This way, we prevent the user from submitting multiple times while the contact is being created or the UI is updating.

Here's the result:

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, useNavigation } from 'react-router';

const ContactForm = () => {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting' && navigation.formAction === '/contacts/new';
  const isLoading = navigation.state === 'loading' && navigation.formAction === '/contacts/new';
  const disabled = isSubmitting || isLoading;
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Contact</h1>
      <Form className="space-y-4" method="POST">
        {/* your fields */}
        <Button type="submit" disabled={disabled }>
          {disabled ? 'Creating...' : 'Create Contact'}
        </Button>
      </Form>
    </div>
  );
};

export default ContactForm;
```

With this, we achieve a better UX and prevent unnecessary multiple submits.

---

## Conclusion

That's it for this sixth part, where we've created an action, handled the form, redirected after submit, and managed loading state.

You might be wondering: what about validation? What if I have multiple actions on the same page, like editing or deleting contacts?

We'll cover all that in the next installment: **how to handle multiple actions, validations, and actions that don't depend on a** `<Form>`.

See you in the [next one](https://dev.to/kevinccbsg/react-router-data-mode-parte-7-multiples-acciones-y-manejo-de-formularios-en-una-sola-pagina-4bm9)!
