Continuamos con la **novena entrega** de esta serie sobre **React Router Data Mode**.
En esta ocasión vamos a hablar de un concepto muy interesante, y que con React Router es bastante sencillo de aplicar: el **Optimistic UI**.

---

Si vienes del [post anterior](https://dev.to/kevinccbsg/react-router-data-mode-parte-8-validaciones-usefetcher-y-react-hook-form-4e5p), puedes continuar con tu proyecto tal cual. Pero si prefieres empezar limpio o asegurarte de estar en el punto exacto, ejecuta los siguientes comandos:

```bash
# Enlace del repositorio https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 08-fetcher
```

## ¿Qué es el Optimistic UI?

**Optimistic UI**, o interfaz de usuario optimista, es una técnica donde la interfaz asume que una acción del usuario tendrá éxito, y se actualiza **inmediatamente**, sin esperar la respuesta del servidor.
Esto mejora notablemente la experiencia percibida por el usuario, ya que la aplicación se siente más rápida y reactiva.

En nuestro caso, tenemos un lugar perfecto para aplicarlo: el botón de favoritos en el detalle de un contacto.
Actualmente, al pulsarlo, hay un pequeño retraso hasta que se refleja el cambio. Vamos a solucionarlo.

## Implementación

Vamos a trabajar sobre el componente de detalle (`src/components/ContactCard/ContactCard.tsx`), que contiene los botones de **borrar** y **marcar como favorito**.
Para ello, vamos a usar dos instancias de `useFetcher`: una para el delete y otra para el patch.

```ts
const deleteFetcher = useFetcher();
const toggleFavFetcher = useFetcher();
```

Y creamos variables para identificar si cada acción está en curso:

```ts
const disableDelete = deleteFetcher.state === "submitting" || deleteFetcher.state === "loading";
const optimisticToggleFav = toggleFavFetcher.state === "submitting" || toggleFavFetcher.state === "loading";
```

Con esto logramos dos cosas:

- Deshabilitar los botones mientras se ejecuta la acción, evitando múltiples pulsaciones.
- Reflejar visualmente el cambio de favorito **antes** de que termine la acción.

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

## Resultado final del componente

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

## Caso de uso más complejo: Sidebar

Otro buen lugar para aplicar Optimistic UI es el **sidebar**, al crear un nuevo contacto. Queremos que aparezca al instante, sin esperar al redirect.

### Refactor del Sidebar

Ahora acepta una nueva prop `pendingContactName`, que muestra un contacto en creación.

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

### En Contacts.tsx usamos useFetchers

Este hook nos da acceso a todos los fetchers activos. Filtramos el del formulario de creación, accedemos al `formData`, y reconstruimos el nombre del nuevo contacto.


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

### Resultado final del componente

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

## Conclusión

Con React Router y `useFetcher`, implementar Optimistic UI es bastante simple y flexible.
Tú decides hasta dónde quieres llegar: desde un pequeño cambio visual, hasta añadir elementos a la vista antes de que existan en la base de datos.

Si quieres ver esto en acción, te recomiendo este [video de Remix](https://www.youtube.com/watch?v=EdB_nj01C80). Los conceptos aplican igual.

En el próximo y último post de la serie hablaremos de testing.
Una parte clave en cualquier desarrollo serio, y que muchas veces se deja para el final (cuando no debería).

¡Nos vemos en la [siguiente entrega](https://dev.to/kevinccbsg/react-router-data-mode-parte-10-testing-con-vitest-y-react-testing-library-38ba)!

