Continuamos con la cuarta entrega de esta serie sobre React Router data mode. En esta ocasión seguimos profundizando en los _loaders_, primero añadiendo la pantalla de detalle de un contacto y luego explorando hooks como `useRouteLoaderData` y `useParams`.

---

Si vienes del [post anterior](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/es/Parte-3-Loaders-y-carga-de-datos.md), puedes continuar con tu proyecto tal cual. Pero si prefieres empezar limpio o asegurarte de estar en el punto exacto, ejecuta los siguientes comandos:

```bash
# Enlace del repositorio https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 03-loaders-detail-page
```

## Un poco de repaso

Hasta ahora solo tenemos las rutas `/` y `contacts/new`, pero nos falta algo clave: una página de detalle para cada contacto. Esta página vivirá dentro de la ruta raíz `/`, así que debemos:

1. Crear la nueva página.
2. Añadir una ruta anidada con parámetro.
3. Revisar nuestros enlaces.

### 1. Creamos la página

Creamos `src/pages/ContactDetail.tsx`, por ahora con un diseño muy básico. En la próxima parte mejoraremos el UI:

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

### 2. Creamos la ruta anidada

Queremos que la ruta cambie según el contacto: `contacts/:contactId`. No usaremos query params como `?id=123`, porque **no estamos filtrando una lista**, sino accediendo a un recurso individual.

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

### 3. Revisar nuestros enlaces

Nuestros enlaces ya estaban bien definidos:

```tsx
<Link to={`/contacts/${contact.id}`} viewTransition>
  {contact.firstName} {contact.lastName}
</Link>
```

Sin embargo, ahora podemos ver que al seleccionar cada contacto la URL cambia pero el contenido es el mismo. Esto es porque nuestra página siempre muestra el mismo contenido. Tenemos que añadir nuestro loader.

---

## Añadimos el loader para el detalle

Ahora mismo, da igual qué contacto seleccionemos: siempre se muestra el mismo contenido. Necesitamos un loader para que cargue el contacto correcto.

Creamos un nuevo método en `src/pages/loader.ts`. Esta vez sí necesitaremos acceder a `params` para obtener el `contactId`.

```ts
export const loadContactDetail = async ({ params }: LoaderFunctionArgs) => {
  const contactId = params.contactId;
  /*
  Aquí validamos que contactId exista.
  La gestión de errores 404 o respuestas inválidas las veremos en
  otro post
  */
  if (!contactId) {
    throw new Error("Contact ID is required");
  }
  const contact = await fetchContactById(contactId);
  return { contact };
};
```

También actualizamos la función en `src/api/contacts.ts` para simular un delay:

```ts
export const fetchContactById = async (id: string) => {
  const response = await api.get<Contact>(`/contacts/${id}`);
  await delay(500); // Simulate network delay
  return response.data;
};
```

Y ahora sí, conectamos todo en las rutas:

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

Y en el componente:

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

Con esto ya tenemos nuestra pantalla de detalle funcional usando loaders. 🎯

---

## ¿Pero no teníamos ya ese dato en otro loader?

Nuestra pantalla de detalle vive dentro de la ruta principal `/`, la cual ya carga todos los contactos. ¿Tiene sentido hacer otra llamada a la API solo para mostrar un contacto que ya tenemos?

Podemos evitarlo utilizando el hook `useRouteLoaderData`.

## Usando useRouteLoaderData

Este hook permite acceder a los datos de un loader. En nuestro caso, la ruta raíz (`/`).

Primero, le damos un `id` a esa ruta y eliminamos el loader del detalle:

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

Y en el componente:

```tsx
import { useRouteLoaderData } from "react-router";
import { loadContacts } from "./loader";

const ContactDetail = () => {
  const routeData = useRouteLoaderData<typeof loadContacts>("root");
  if (!routeData) {
    return <div>Loading...</div>;
  }
  const contact = routeData.contacts[0]; // Por simplicidad, mostramos el primero
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

Como puedes ver, usamos `useRouteLoaderData` con el ID `"root"` para acceder a los datos ya cargados por el loader de la ruta principal. Además, añadimos `typeof loadContacts` para que TypeScript nos dé autocompletado y chequeo de tipos. Es importante validar que los datos existan, ya que en la primera carga podrían no estar disponibles. Por eso mostramos un fallback mientras tanto (Loading...).

## Pero necesitamos saber qué contacto mostrar

Para eso usamos `useParams` para acceder a los `params` que tengamos definidos en la URL:

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

Tenemos la navegación entre contactos funcionando con los datos ya cargados, sin peticiones extra. También repasamos cómo usar los `params` en los `loaders` y en los componentes, con todo bien tipado.

---

En la [parte 5](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/es/Parte-5-refactor-useParams-y-NavLink.md) mejoraremos el diseño del detalle y haremos refactor en la navegación, asegurándonos de que el enlace activo se marque correctamente.
¡Nos vemos en la próxima!
