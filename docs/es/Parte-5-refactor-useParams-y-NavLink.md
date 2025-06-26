Continuamos con la **quinta entrega** de esta serie sobre React Router Data Mode. En esta ocasión, será un post breve donde haremos algunos refactors y repasaremos el hook `useParams`, además de mejorar la navegación con `NavLink`.

---

Si vienes del [post anterior](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/es/Parte-4%E2%80%93Rutas-con-par%C3%A1metros-useRouteLoaderData-y-useParams.md), puedes continuar con tu proyecto tal cual. Pero si prefieres empezar limpio o asegurarte de estar en el punto exacto, ejecuta los siguientes comandos:

```bash
# Enlace del repositorio https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 04-refactor-sidebar-detail
```

## Refactor

Empezamos mejorando la vista de detalle.

Creamos `src/components/ContactCard/ContactCard.tsx`:

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

Luego actualizamos la página de detalle `src/pages/ContactDetail.tsx` para usar ese nuevo componente:

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

Ahora creamos el componente `src/components/Sidebar/Sidebar.tsx`:

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

Este componente ya incorpora búsqueda local, aunque no será el foco en este post.
Lo importante aquí es la navegación.

Actualizamos la página principal `pages/contacts.tsx`:

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

## ¿Cómo marcamos el enlace activo?

Para marcar correctamente qué contacto está seleccionado, usamos el hook `useParams`:

```ts
const { contactId } = useParams<{ contactId: string }>();
```

Y con eso, ajustamos el botón en la lista de contactos:

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

Con este cambio, ya se muestra correctamente el contacto activo en el listado.

## ¿Y NavLink?

React Router también incluye el componente https://reactrouter.com/api/components/NavLink#props, que extiende `Link` con mejoras para los estados `active` y `pending`.

En concreto:

- Aplica automáticamente classes al link cuando el enlace está activo o pendiente.
- Añade el atributo `aria-current="page"` cuando el enlace representa la ruta actual.

En nuestro caso, como usamos `Button` de ShadCN, no aprovechamos las classes CSS de `NavLink`, pero sí podemos beneficiarnos de su soporte de accesibilidad (aria-current), lo cual es una buena práctica para navegaciones como esta.

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

Y eso sería todo por esta parte. En la [siguiente entrega](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/es/Parte-6-Actions-formularios-mutaciones.md) entraremos con actions, otro concepto heredado de Remix muy interesante, que nos permitirá empezar a hacer mutaciones dentro de la app 💥

¡Nos vemos en la próxima!
