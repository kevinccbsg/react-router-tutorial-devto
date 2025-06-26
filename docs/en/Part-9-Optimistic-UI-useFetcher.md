We continue with the **ninth installment** of this series on **React Router Data Mode**.
This time, we'll talk about a very interesting concept that is quite easy to implement with React Router: **Optimistic UI**.

---

If you're coming from the [previous post](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/en/Part-8-validation-useFetcher-React-Hook-Form.md), you can continue with your project as is. But if you prefer to start fresh or make sure you're at the exact point, run the following commands:

```bash
# Repository link https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 08-fetcher
```

## What is Optimistic UI?

**Optimistic UI** is a technique where the interface assumes that a user's action will succeed and updates **immediately**, without waiting for the server's response.
This greatly improves the perceived user experience, as the app feels faster and more responsive.

In our case, we have a perfect place to apply it: the favorite button in the contact detail view.
Currently, when you click it, there's a slight delay before the change is reflected. Let's fix that.

## Implementation

We'll work on the detail component (`src/components/ContactCard/ContactCard.tsx`), which contains the **delete** and **mark as favorite** buttons.
For this, we'll use two instances of `useFetcher`: one for delete and one for patch.

```ts
const deleteFetcher = useFetcher();
const toggleFavFetcher = useFetcher();
```

And we'll create variables to identify if each action is in progress:

```ts
const disableDelete = deleteFetcher.state === "submitting" || deleteFetcher.state === "loading";
const optimisticToggleFav = toggleFavFetcher.state === "submitting" || toggleFavFetcher.state === "loading";
```

With this, we achieve two things:

- Disable the buttons while the action is running, preventing multiple clicks.
- Visually reflect the favorite change **before** the action finishes.

```tsx
<deleteFetcher.Form method="DELETE">
  <input type="hidden" name="id" value={id} />
  <Button type="submit" variant="destructive" disabled={disableDelete}>
    {disableDelete ? "Deleting..." : "Delete"}
  </Button>
</deleteFetcher.Form>
<toggleFavFetcher.Form method="PATCH">
  <input type="hidden" name="id" value={id} />
  <input type="hidden" name="favorite" value={String(!favorite)} />
  <Button type="submit" variant="ghost" disabled={optimisticToggleFav}>
      {optimisticToggleFav
      ? (!favorite ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />)
      : (favorite ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />)
      }
  </Button>
</toggleFavFetcher.Form>
```

## Final component result

```tsx
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Star, StarOff } from "lucide-react"
import { useFetcher } from "react-router";

interface Contact {
  id: string;
  name: string;
  username: string;
  favorite: boolean;
  avatar?: string;
}

export default function ContactCard({ avatar, name, username, favorite, id }: Contact) {
  const deleteFetcher = useFetcher();
  const toggleFavFetcher = useFetcher();
  const disableDelete = deleteFetcher.state === "submitting" || deleteFetcher.state === "loading";
  const optimisticToggleFav = toggleFavFetcher.state === "submitting" || toggleFavFetcher.state === "loading";
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
          <deleteFetcher.Form method="DELETE">
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="destructive" disabled={disableDelete}>
              {disableDelete ? "Deleting..." : "Delete"}
            </Button>
          </deleteFetcher.Form>
          <toggleFavFetcher.Form method="PATCH">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="favorite" value={String(!favorite)} />
            <Button type="submit" variant="ghost" disabled={optimisticToggleFav}>
                {optimisticToggleFav
                ? (!favorite ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />)
                : (favorite ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />)
                }
            </Button>
          </toggleFavFetcher.Form>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## More complex use case: Sidebar

Another good place to apply Optimistic UI is the **sidebar**, when creating a new contact. We want it to appear instantly, without waiting for the redirect.

### Sidebar refactor

Now it accepts a new prop `pendingContactName`, which shows a contact being created.

```tsx
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Link, NavLink, useParams } from "react-router"
import { useState } from "react";

interface Contact {
  id: string;
  name: string;
}

export default function Sidebar({ contacts, pendingContactName }: { contacts: Contact[], pendingContactName?: string }) {
  const { contactId } = useParams<{ contactId: string }>();
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
              variant={contact.id === contactId ? "default" : "ghost"}
              asChild
            >
              <NavLink to={`/contacts/${contact.id}`} viewTransition>
                {contact.name}
              </NavLink>
            </Button>
          ))}
          {pendingContactName && (
            <Button
              className="justify-start"
              disabled
            >
                {pendingContactName}
            </Button>
          )}
        </div>
      </ScrollArea>
    </>
  )
}
```

### In Contacts.tsx we use useFetchers

This hook gives us access to all active fetchers. We filter the one for the creation form, access its `formData`, and reconstruct the new contact's name.

```tsx
const fetchers = useFetchers();
const submitContacts = fetchers.find(fetcher => 
  fetcher.formMethod === 'POST' && fetcher.formAction === '/contacts/new'
);
let username = '';
if (submitContacts && submitContacts.state === 'loading' && submitContacts.formData) {
  const formData = submitContacts.formData;
  const firstName = formData.get('firstName') as string || '';
  const lastName = formData.get('lastName') as string || '';
  username = `${firstName} ${lastName}`;
}
```

### Final component result

```tsx
import { Outlet, useFetchers, useLoaderData } from "react-router";
import { loadContacts } from "./loader";
import Sidebar from "@/components/Sidebar/Sidebar";

const ContactsPage = () => {
  const { contacts } = useLoaderData<typeof loadContacts>();
  const fetchers = useFetchers();
  const submitContacts = fetchers.find(fetcher => 
    fetcher.formMethod === 'POST' && fetcher.formAction === '/contacts/new'
  );
  let username = '';
  if (submitContacts && submitContacts.state === 'loading' && submitContacts.formData) {
    const formData = submitContacts.formData;
    const firstName = formData.get('firstName') as string || '';
    const lastName = formData.get('lastName') as string || '';
    username = `${firstName} ${lastName}`;
  }
  return (
    <div className="h-screen grid grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <div className="border-r p-4 flex flex-col gap-4">
        <Sidebar contacts={contacts.map(contact => ({
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
        }))} pendingContactName={username}/>
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

---

## Conclusion

With React Router and `useFetcher`, implementing Optimistic UI is quite simple and flexible.
You decide how far you want to go: from a small visual change to adding elements to the view before they exist in the database.

If you want to see this in action, I recommend this [Remix video](https://www.youtube.com/watch?v=EdB_nj01C80). The concepts apply the same way.

In the next and final post of the series, we'll talk about testing.
A key part of any serious development, and one that is often left for last (when it shouldn't be).

See you in the [next installment](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/en/Part-10-Testing-Vitest-React-Testing-Library.md)!

