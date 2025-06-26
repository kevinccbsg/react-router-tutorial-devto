We continue with the **fifth part** of this series on React Router Data Mode. This time, it will be a brief post where we’ll do some refactors, review the `useParams` hook, and improve navigation with `NavLink`.

---

If you’re coming from the [previous post](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/en/Part-4%E2%80%93dynamic-routes-useRouteLoaderData-useParams.md), you can continue with your project as is. But if you prefer to start fresh or make sure you’re at the exact point, run the following commands:

```bash
# Repository link https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 04-refactor-sidebar-detail
```

## Refactor

Let’s start by improving the detail view.

Create `src/components/ContactCard/ContactCard.tsx`:

```tsx
import { Form } from "react-router";
import { Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface Contact {
  id: string;
  name: string;
  username: string;
  favorite: boolean;
  avatar?: string;
}

export default function ContactCard({ avatar, name, username, favorite, id }: Contact) {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="flex flex-col items-center gap-4 p-6">
        <Avatar className="w-32 h-32">
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-xl font-bold">{name}</h2>
          {username && (
            <p className="text-sm text-muted-foreground">{username}</p>
          )}
        </div>
        <div className="flex gap-2">
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
        </div>
      </CardContent>
    </Card>
  )
}
```

Then update the detail page `src/pages/ContactDetail.tsx` to use this new component:

```tsx
import { useParams, useRouteLoaderData } from "react-router";
import { loadContacts } from "./loader";
import ContactCard from "@/components/ContactCard/ContactCard";

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
    <ContactCard
      avatar={contact.avatar}
      name={`${contact.firstName} ${contact.lastName}`}
      username={contact.username}
      favorite={contact.favorite}
      id={contact.id}
    />
  );
}

export default ContactDetail;
```

Now create the component `src/components/Sidebar/Sidebar.tsx`:

```tsx
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Link } from "react-router"
import { useState } from "react";

interface Contact {
  id: string;
  name: string;
}

export default function Sidebar({ contacts }: { contacts: Contact[] }) {
  const [search, setSearch] = useState("");

  const handlesearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Input placeholder="Search..." className="mb-2" value={search} onChange={handlesearchChange} />
      <Button className="w-full" variant="secondary" asChild>
        <Link to="/contacts/new" viewTransition>
          New
        </Link>
      </Button>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 mt-4">
          {filteredContacts.map(contact => (
            <Button
              key={contact.id}
              className="justify-start"
              asChild
            >
              <Link to={`/contacts/${contact.id}`} viewTransition>
                {contact.name}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </>
  )
}
```

This component already includes local search, although that won’t be the focus of this post.
The important thing here is navigation.

Update the main page `pages/contacts.tsx`:

```tsx
import { Outlet, useLoaderData } from "react-router";
import { loadContacts } from "./loader";
import Sidebar from "@/components/Sidebar/Sidebar";

const ContactsPage = () => {
  const { contacts } = useLoaderData<typeof loadContacts>();
  return (
    <div className="h-screen grid grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <div className="border-r p-4 flex flex-col gap-4">
        <Sidebar contacts={contacts.map(contact => ({
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
        }))} />
      </div>
      {/* Detail View */}
      <div className="p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default ContactsPage;
```

## How do we mark the active link?

To correctly indicate which contact is selected, we use the `useParams` hook:

```ts
const { contactId } = useParams<{ contactId: string }>();
```

And with that, adjust the button in the contact list:

```tsx
<Button
  key={contact.id}
  className="justify-start"
  variant={contact.id === contactId ? "default" : "ghost"}
  asChild
>
  <Link to={`/contacts/${contact.id}`} viewTransition>
    {contact.name}
  </Link>
</Button>
```

With this change, the active contact is now correctly shown in the list.

## What about NavLink?

React Router also includes the component https://reactrouter.com/api/components/NavLink#props, which extends `Link` with improvements for the `active` and `pending` states.

Specifically:

- It automatically applies classes to the link when it’s active or pending.
- It adds the attribute `aria-current="page"` when the link represents the current route.

In our case, since we use ShadCN’s `Button`, we don’t take advantage of NavLink’s CSS classes, but we can benefit from its accessibility support (aria-current), which is a good practice for navigations like this.

```tsx
<Button
  key={contact.id}
  className="justify-start"
  variant={contact.id === contactId ? "default" : "ghost"}
  asChild
>
  <NavLink to={`/contacts/${contact.id}`} viewTransition>
    {contact.name}
  </NavLink>
</Button>
```

---

And that’s it for this part. In the [next post](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/en/Part-6-Actions-form-mutations.md) we’ll dive into actions, another interesting concept inherited from Remix, which will allow us to start making mutations within the app 💥

See you next time!
