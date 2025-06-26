We continue with the fourth part of this series on React Router data mode. This time, we’ll dive deeper into _loaders_, first by adding a contact detail screen and then exploring hooks like `useRouteLoaderData` and `useParams`.

---

If you’re coming from the [previous post](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/en/Part-3-Loaders.md), you can continue with your project as is. But if you prefer to start fresh or make sure you’re at the exact point, run the following commands:

```bash
# Repository link https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 03-loaders-detail-page
```

## A quick recap

So far, we only have the `/` and `contacts/new` routes, but we’re missing something key: a detail page for each contact. This page will live inside the root route `/`, so we need to:

1. Create the new page.
2. Add a nested route with a parameter.
3. Review our links.

### 1. Create the page

Create `src/pages/ContactDetail.tsx`, for now with a very basic design. In the next part, we’ll improve the UI:

```tsx

const contact = {
  firstName: 'John',
  username: 'john_doe',
};

const ContactDetail = () => {
  return (
    <div>
      <h2>Contact Detail</h2>
      <p>{contact.firstName}</p>
      <p>{contact.username}</p>
    </div>
  );
}

export default ContactDetail;
```

### 2. Create the nested route

We want the route to change according to the contact: `contacts/:contactId`. We won’t use query params like `?id=123`, because **we’re not filtering a list**, but accessing an individual resource.

```tsx
const AppRoutes = createBrowserRouter([
  {
    path: "/",
    loader: loadContacts,
    HydrateFallback: ContactsSkeletonPage,
    Component: ContactsPage,
    children: [
      {
        path: "contacts/:contactId",
        Component: ContactDetail,
      },
      {
        path: "contacts/new",
        Component: ContactForm,
      },
    ],
  },
  ... // the other routes
]);
```

### 3. Review our links

Our links were already well defined:

```tsx
<Link to={`/contacts/${contact.id}`} viewTransition>
  {contact.firstName} {contact.lastName}
</Link>
```

However, now we can see that when selecting each contact, the URL changes but the content remains the same. This is because our page always shows the same content. We need to add our loader.

---

## Add the loader for the detail

Right now, no matter which contact we select, the same content is always shown. We need a loader to load the correct contact.

Create a new method in `src/pages/loader.ts`. This time, we’ll need to access `params` to get the `contactId`.

```ts
export const loadContactDetail = async ({ params }: LoaderFunctionArgs) => {
  const contactId = params.contactId;
  /*
  Here we validate that contactId exists.
  We’ll cover 404 error handling or invalid responses in
  another post
  */
  if (!contactId) {
    throw new Error("Contact ID is required");
  }
  const contact = await fetchContactById(contactId);
  return { contact };
};
```

Also update the function in `src/api/contacts.ts` to simulate a delay:

```ts
export const fetchContactById = async (id: string) => {
  const response = await api.get<Contact>(`/contacts/${id}`);
  await delay(500); // Simulate network delay
  return response.data;
};
```

Now, connect everything in the routes:

```ts
const AppRoutes = createBrowserRouter([
  {
    path: "/",
    loader: loadContacts,
    HydrateFallback: ContactsSkeletonPage,
    Component: ContactsPage,
    children: [
      {
        path: "contacts/:contactId",
        loader: loadContactDetail,
        Component: ContactDetail,
      },
      {
        path: "contacts/new",
        Component: ContactForm,
      },
    ],
  },
  ...
]);
```

And in the component:

```tsx
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
```

With this, we now have our functional detail screen using loaders. 🎯

---

## But didn’t we already have that data in another loader?

Our detail screen lives inside the main route `/`, which already loads all contacts. Does it make sense to make another API call just to show a contact we already have?

We can avoid this by using the `useRouteLoaderData` hook.

## Using useRouteLoaderData

This hook lets you access the data from a loader. In our case, the root route (`/`).

First, give that route an `id` and remove the loader from the detail:

```ts
const AppRoutes = createBrowserRouter([
  {
    path: "/",
    loader: loadContacts,
    id: "root",
    HydrateFallback: ContactsSkeletonPage,
    Component: ContactsPage,
    children: [
      {
        path: "contacts/:contactId",
        Component: ContactDetail,
      },
      {
        path: "contacts/new",
        Component: ContactForm,
      },
    ],
  },
  ...
]);
```

And in the component:

```tsx
import { useRouteLoaderData } from "react-router";
import { loadContacts } from "./loader";

const ContactDetail = () => {
  const routeData = useRouteLoaderData<typeof loadContacts>("root");
  if (!routeData) {
    return <div>Loading...</div>;
  }
  const contact = routeData.contacts[0]; // For simplicity, show the first one
  return (
    <div>
      <h2>Contact Detail</h2>
      <p>{contact.firstName}</p>
      <p>{contact.username}</p>
    </div>
  );
}

export default ContactDetail;
```

As you can see, we use `useRouteLoaderData` with the ID `"root"` to access the data already loaded by the root route’s loader. We also add `typeof loadContacts` so TypeScript gives us autocomplete and type checking. It’s important to validate that the data exists, since on the first load it might not be available. That’s why we show a fallback (Loading...) in the meantime.

## But we need to know which contact to show

For that, we use `useParams` to access the `params` defined in the URL:

```tsx
import { useParams, useRouteLoaderData } from "react-router";
import { loadContacts } from "./loader";

const ContactDetail = () => {
  const { contactId } = useParams<{ contactId: string }>(); // Needs TS type annotation
  const routeData = useRouteLoaderData<typeof loadContacts>("root");
  if (!routeData) {
    return <div>Loading...</div>;
  }

  const { contacts } = routeData;
  
  // Find the contact locally
  const contact = contacts.find(({ id }) => id === contactId);

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
```

Now we have navigation between contacts working with already loaded data, without extra requests. We also reviewed how to use `params` in both `loaders` and components, with proper typing.

---

In [part 5](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/en/Part-5-refactor-useParams-NavLink.md) we’ll improve the detail design and refactor navigation, making sure the active link is correctly marked.
See you in the next one!
