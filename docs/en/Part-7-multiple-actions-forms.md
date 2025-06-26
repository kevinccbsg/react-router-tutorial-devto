We continue with the seventh installment of this series on React Router Data Mode. This time, we'll dive deeper into using _actions_ and how to handle multiple mutations within the same page: the contact detail page.

---

If you're coming from the [previous post](https://dev.to/kevinccbsg/react-router-data-mode-parte-6-actions-formularios-y-mutaciones-5354), you can continue with your project as is. But if you prefer to start fresh or make sure you're at the exact point, run the following commands:

```bash
# Repository link https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 06-multiple-actions
```

## Reviewing our detail component

In our detail page `src/pages/ContactDetail.tsx`, we had a component called `ContactCard`.

If we look at that component, we'll see it already includes two forms: one to delete the contact and another to mark it as a favorite. Both forms wrap `submit` buttons that trigger their respective actions:

```tsx
<Form method="DELETE">
  <input type="hidden" name="id" value={id} />
  <Button type="submit" variant="destructive">Delete</Button>
</Form>
<Form method="PATCH">
  <input type="hidden" name="id" value={id} />
  <input type="hidden" name="favorite" value={String(!favorite)} />
  <Button type="submit" variant="ghost">
    {favorite ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
  </Button>
</Form>
```

Now, why do we have two forms?
If we want to take advantage of the data handling that React Router offers, we need our mutations to reach an `action`, and for that, they must be inside a `Form` component from `react-router`.

But if we have multiple forms, how do we know which action to execute? There are several strategies:

- We can use the method, as in the example, to indicate whether it's POST, PATCH, PUT, or DELETE.
- We can include a hidden input to specify the desired action type. For example: `<input type="hidden" name="actionType" value="toggleFavorite" />`

You'll also notice that we use a hidden input with `name="id"` to send the contact's ID. This allows us to access that value inside the action and perform operations like deleting or updating in the API.
This pattern isn't new; it's part of classic HTML form behavior. More info here → [MDN - input hidden](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/hidden)

## Our action

Once we have the forms ready, we need to connect the route with its `action`. Let's create it in `src/pages/action.ts`:

```tsx
export const contactDetailActions = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const method = request.method.toUpperCase();

  if (method === 'DELETE') {
    const id = formData.get("id") as string;
    await deleteContact(id);
    return redirect("/");
  } else if (method === 'PATCH') {
    const id = formData.get("id") as string;
    const favorite = formData.get("favorite") === "true";
    await updateFavoriteStatus(id, favorite);
    return null;
  }
  return null;
};
```

As you can see, just like when creating a new contact, we get the data from `request.formData()`.
We can retrieve the ID because we included it as a hidden input.

Then, in `src/AppRoutes.tsx`, we configure the route to use this `action`:

```ts
{
  path: "contacts/:contactId",
  action: contactDetailActions,
  Component: ContactDetail,
}
```

With this, both actions should work correctly.

## A bit of refactoring

We can refactor the action to avoid nesting several `if/else` statements, using a handlers object:

```tsx
import { ActionFunctionArgs, redirect } from "react-router";
import { createContact, deleteContact, updateFavoriteStatus } from "@/api/contacts";

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

  const handlers: Record<string, () => Promise<Response | null>> = {
    POST: async () => {
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
    },
  };

  if (handlers[method]) {
    return handlers[method]();
  }

  return null;
};

export const contactDetailActions = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const method = request.method.toUpperCase();

  const handlers: Record<string, () => Promise<Response | null>> = {
    DELETE: async () => {
      const id = formData.get("id") as string;
      await deleteContact(id);
      return redirect("/");
    },
    PATCH: async () => {
      const id = formData.get("id") as string;
      const favorite = formData.get("favorite") === "true";
      await updateFavoriteStatus(id, favorite);
      return null;
    },
  };

  if (handlers[method]) {
    return handlers[method]();
  }

  return null;
};
```

---

With this, we now have a way to handle multiple `actions` within the same page, something very common in real-world applications. The specific strategy you choose will depend on your use case, and in future posts, we'll explore more options.

But you're probably wondering a few things:

- **Do I have to put a form on every button?**
Normally, you'd do this with an `onClick`. In the next post, we'll see how to use `useFetcher` for these cases.

- **How can I validate form data?**
We'll cover this in the next post.

- **Why is there a slight delay when deleting or updating?**
We added that delay on purpose to simulate slow API behavior. Later, we'll talk about how to improve the experience using techniques like Optimistic UI.

See you in the [next installment](https://dev.to/kevinccbsg/react-router-data-mode-parte-8-validaciones-usefetcher-y-react-hook-form-4e5p). This post covers one of the most important concepts in the series, but there are still many interesting topics to explore.
