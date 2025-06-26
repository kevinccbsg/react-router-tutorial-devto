En esta segunda entrega de nuestro tutorial de React Router v7, vamos a profundizar en el sistema de rutas: cómo anidar vistas dentro de un layout compartido, cómo navegar sin recargar la página usando `Link`, y cómo añadir transiciones visuales para una experiencia más fluida.

Si vienes del [tutorial anterior](https://dev.to/kevinccbsg/react-router-data-mode-parte-1-instalacion-y-primeras-rutas-ok9), puedes dejar el proyecto tal cual, pero si quieres asegurarte de que todo esté limpio o empezar desde el mismo punto, puedes ejecutar los siguientes comandos:

```bash`
## Enlace del repositorio https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 01-outlet-nested-routes-links
```

## Estructura inicial de rutas

Vamos a preparar primero nuestro archivo de rutas. Modificaremos el archivo `src/AppRoutes.tsx` para utilizar la propiedad `Component` en lugar de `element` para nuestras páginas principales. Usamos `Component` en vez de `element` cuando queremos pasar directamente una referencia al componente, sin necesidad de JSX (<Componente />).

El código nos va a quedar así:

```tsx
import { createBrowserRouter } from "react-router";
import ContactsPage from "./pages/Contacts";
import ContactForm from "./pages/ContactForm";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    Component: ContactsPage,
  },
  {
    path: "/contacts/new",
    Component: ContactForm,
  },
  {
    path: "/about",
    element: <div>About</div>,
  },
  {
    path: "*",
    element: <div>Not Found</div>,
  },
]);

export default AppRoutes;
```

Como ves, simplemente indicamos qué componente se debe mostrar para cada ruta.

## Crear nuestras páginas

Ahora vamos a crear los componentes `ContactsPage` y `ContactForm`. Para organizarnos mejor, los vamos a guardar en una nueva carpeta `src/pages`.

`src/pages/Contacts.tsx`

```tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const contacts = [ // datos mock
  {
    "id": "1",
    "firstName": "Jane",
    "lastName": "Doe",
    "username": "jane_doe",
    "avatar": "https://i.pravatar.cc/150?img=1",
    "email": "jane.doe@example.com",
    "phone": "+1 555-1234",
    "favorite": true
  },
  {
    "id": "2",
    "firstName": "John",
    "lastName": "Smith",
    "username": "john_smith",
    "avatar": "https://i.pravatar.cc/150?img=12",
    "email": "john.smith@example.com",
    "phone": "+1 555-5678",
    "favorite": true
  }
];

const ContactsPage = () => {
  return (
    <div className="h-screen grid grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <div className="border-r p-4 flex flex-col gap-4">
        <Button className="w-full" variant="secondary" asChild>
          <a href="/contacts/new">
            New
          </a>
        </Button>
        <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 mt-4">
          {contacts.map(contact => (
            <Button
              key={contact.id}
              className="justify-start"
              asChild
            >
              <a href={`/contacts/${contact.id}`}>
                {contact.firstName} {contact.lastName}
              </a>
            </Button>
          ))}
        </div>
      </ScrollArea>
      </div>
      {/* Detail View */}
      <div className="p-8">
        Contact page
      </div>
    </div>
  );
};

export default ContactsPage;
```

`src/pages/ContactForm.tsx`

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ContactForm = () => {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Contact</h1>
      <form className="space-y-4">
        <div>
          <Label className="mb-2" htmlFor="firstName">First Name</Label>
          <Input type="text" id="firstName" name="firstName" required />
        </div>
        <div>
          <Label className="mb-2" htmlFor="lastName">Last Name</Label>
          <Input type="text" id="lastName" name="lastName" required />
        </div>
        <div>
          <Label className="mb-2" htmlFor="username">Username</Label>
          <Input type="text" id="username" name="username" required />
        </div>
        <div>
          <Label className="mb-2" htmlFor="email">Email</Label>
          <Input type="email" id="email" name="email" required />
        </div>
        <div>
          <Label className="mb-2" htmlFor="phone">Phone</Label>
          <Input type="tel" id="phone" name="phone" required />
        </div>
        <div>
          <Label className="mb-2" htmlFor="avatar">Avatar (Optional)</Label>
          <Input type="url" id="avatar" name="avatar" />
        </div>
        <Button type="submit">
          Create Contact
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
```

Si visitas `/` o `/contacts/new`, deberías ver ambas páginas, pero… algo no está bien:

El formulario se muestra como una página independiente, sin mantener el layout con sidebar. Además, al usar el enlace "New", vemos una recarga completa de la página, lo cual nos indica que todavía no tenemos una navegación tipo SPA bien configurada.

![página de inicio sin el outlet](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/l7xdpuokho451ba9d79v.png)

![página de formulario sin la sidebar](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/clcuaphq917ub6ulvwnp.png)

## Anidar rutas dentro de un layout

Ahora que tenemos ambas páginas, vamos a hacer que la ruta de `/contacts/new` no sea independiente, sino que se renderice dentro del layout de la página principal de contactos (es decir, dentro de `ContactsPage`).

```tsx
import { createBrowserRouter } from "react-router";
import ContactsPage from "./pages/Contacts";
import ContactForm from "./pages/ContactForm";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    Component: ContactsPage,
    children: [
      {
        path: "contacts/new",
        Component: ContactForm,
      },
    ],
  },
  {
    path: "/about",
    element: <div>About</div>,
  },
  {
    path: "*",
    element: <div>Not Found</div>,
  },
]);

export default AppRoutes;
```

Ya tenemos la ruta anidada, pero aún no se mostrará hasta que indiquemos dónde deben aparecer los `children`. Para eso usamos el componente `Outlet`.

## Mostrar rutas hijas con Outlet

Dentro del componente `ContactsPage`, vamos a importar y colocar `Outlet` justo donde queremos que se muestren las páginas hijas:

```tsx
// Importamos el componente
import { Link, Outlet } from "react-router";
```

```tsx
{/* Detail View */}
<div className="p-8">
  <Outlet />
</div>
```

## Navegación sin recarga con Link

Hasta ahora hemos usado `<a>` para los enlaces, pero eso provoca una recarga completa de la página. Para hacer navegación del lado del cliente (sin recargar), debemos usar el componente `Link` de `react-router`.

En lugar de esto:

```tsx
<a href="/contacts/new">New</a>
```

Hacemos esto:

```tsx
<Link to="/contacts/new" viewTransition>
  New
</Link>
```

```tsx
<Link to={`/contacts/${contact.id}`} viewTransition>
  {contact.firstName} {contact.lastName}
</Link>
```

La prop `viewTransition` activa animaciones de transición entre rutas de forma automática (si el navegador lo soporta). ¡Muy útil para que la navegación se sienta más fluida! Por defecto hace un fadeIn esto se puede customizar mucho más. Podemos hablar de ello en un futuro post.

## Recapitulando lo aprendido

Hasta ahora hemos conseguido:

- Tener una ruta principal con layout
- Anidar rutas para que se muestren dentro de ese layout
- Usar Link en lugar de a para evitar recargas
- Activar transiciones visuales entre rutas

## ¿Qué sigue?

En la siguiente parte vamos a hacer algo muy potente: renderizar datos dinámicos en función de la URL y aprender a usar loader para cargar datos.
¡Nos metemos de lleno en la magia de React Router v7!

Nos vemos en la [parte 3](https://dev.to/kevinccbsg/react-router-data-mode-parte-3-loaders-y-carga-de-datos-3bn1).

