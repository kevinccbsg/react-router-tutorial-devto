Vamos con la tercera parte de esta serie de tutoriales. En este caso, veremos un concepto que viene de Remix y que ahora también podemos encontrar en React Router: los **loaders**.

Si vienes del [tutorial anterior](https://dev.to/kevinccbsg/react-router-data-mode-parte-2-rutas-anidadas-y-outlets-4i17), puedes dejar el proyecto tal cual, pero si quieres asegurarte de que todo esté limpio o empezar desde el mismo punto, puedes ejecutar los siguientes comandos:

```bash
# Enlace del repositorio https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 02-loaders-detail-page
```

## ¿Qué son los loaders?

Los _loaders_ son un mecanismo que React Router nos da para enviar información a nuestros componentes. Son funciones que añadimos en nuestra definición de rutas.

Este sería un ejemplo:

```tsx
createBrowserRouter([
  {
    path: "/",
    loader: async () => {
      // return data from here
      return { records: await getSomeRecords() };
    },
    Component: MyRoute,
  },
]);
```

En los _loaders_ añadimos todo lo que consideramos necesario cargar en esa página. Al trabajar con React Router, debemos empezar a pensar por página, ya que toda la carga y mutación de datos se organiza a ese nivel.

En nuestra página de contactos, actualmente usamos un array con datos _hardcodeados_, lo cual no representa un caso real. Así que lo vamos a sustituir por una llamada a una API que hemos creado con `json-server`.
No entraremos en detalle sobre qué es [`json-server`](https://www.npmjs.com/package/json-server) (es básicamente una forma rápida de simular una API REST con un archivo JSON), solo comentar que a partir de ahora probaremos la app con el comando:

```bash
npm run serve:dev
```

Este comando nos levanta tanto la API con `json-server` como el frontend.

En la carpeta `src/api` están todos los métodos que llaman a la API usando Axios. Como esta serie trata de React Router, no entraremos en detalle sobre esa parte.

Una vez comentado el modo de trabajo, empezamos con el refactor. Normalmente en React, para hacer carga de datos en un componente, usamos algo como:

```tsx
const [contacts, setContacts] = useState<Contact[]>([]);

useEffect(() => {
  fetchContacts()
    .then((data) => setContacts(data))
}, []);
```

Con React Router, esto cambia, ya que usaremos un loader definido en `AppRoutes.tsx`:

```tsx
import { createBrowserRouter } from "react-router";
import ContactsPage from "./pages/Contacts";
import ContactForm from "./pages/ContactForm";
import { fetchContacts } from "@/api/contacts";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    // esta propiedad
    loader: async () => {
      const contacts = await fetchContacts();
      return { contacts };
    },
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

Aunque esto funciona, y luego podríamos acceder a los datos usando un hook de React Router, **no te recomiendo hacerlo así**. El archivo de rutas puede crecer mucho, y además más adelante necesitaremos resolver un problema de tipado con TypeScript, para lo cual este enfoque no es el ideal.

Lo mejor es crear un archivo separado, por ejemplo: `src/pages/loader.tsx`:

```ts
import { fetchContacts } from "@/api/contacts";

export const loadContacts = async () => {
  const contacts = await fetchContacts();
  return { contacts };
};
```

Y así dejamos el archivo `AppRoutes.tsx` mucho más limpio:

```tsx
import { createBrowserRouter } from "react-router";
import ContactsPage from "./pages/Contacts";
import ContactForm from "./pages/ContactForm";
import { loadContacts } from "./pages/loader";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    loader: loadContacts,
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

Si navegamos a la web, veremos en la pestaña "Network" que se realiza la llamada a la API.

![pestaña network con la llamada](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/oho2mzpzgfzht390qyp3.png)

Pero los datos siguen estando _hardcodeados_ en la UI. ¿Cómo recuperamos la info?

Usamos el hook `useLoaderData` de React Router:

```tsx
const { contacts } = useLoaderData();
```

Este hook siempre nos devuelve lo que retorna el _loader_ definido en la ruta del componente. En este caso, un objeto con `contacts`.

Ahora bien, si usamos esto en un proyecto con TypeScript, nos dará un error de tipado. Para solucionarlo, lo escribimos así:

```tsx
const { contacts } = useLoaderData<typeof loadContacts>();
```

Quedando el componente `Contacts` de la siguiente manera:

```tsx
import { Link, Outlet, useLoaderData } from "react-router";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { loadContacts } from "./loader";

const ContactsPage = () => {
  const { contacts } = useLoaderData<typeof loadContacts>();
  return (
    <div className="h-screen grid grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <div className="border-r p-4 flex flex-col gap-4">
        <Button className="w-full" variant="secondary" asChild>
          <Link to="/contacts/new" viewTransition>
            New
          </Link>
        </Button>
        <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 mt-4">
          {contacts.map(contact => (
            <Button
              key={contact.id}
              className="justify-start"
              asChild
            >
              <Link to={`/contacts/${contact.id}`} viewTransition>
                {contact.firstName} {contact.lastName}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
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

Por eso es más cómodo tener un archivo de loader por página, ya que mejora la gestión de tipos y queda todo más separado.

Con esto, estamos haciendo lo mismo que hacíamos con `useEffect`, pero **de la forma recomendada en React Router**.

---

Por último, puede que hayas notado un warning en la terminal:


![warning hidrate fallback](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8drcsa5w1l5kuxrev63k.png)

Esto se debe a que aún no tenemos una pantalla de carga. Podemos simular un delay en la API para ver el problema. En `src/api/contacts.ts`, descomenta la función `delay` y modifica `fetchContacts`:

```ts
export const fetchContacts = async () => {
  const response = await api.get<Contact[]>('/contacts');
  await delay(2000); // Simula latencia de red
  return response.data;
};
```

Al recargar, veremos que la página queda en blanco unos segundos hasta que se cargan los datos. Esto es porque no hay un _loading state_. React Router permite manejar esto de varias formas, pero en este post usaremos la propiedad `HydrateFallback`.

En este proyecto ya tenemos el componente `ContactsSkeletonPage`, así que lo añadimos así:

```tsx
import { createBrowserRouter } from "react-router";
import ContactsPage from "./pages/Contacts";
import ContactForm from "./pages/ContactForm";
import { loadContacts } from "./pages/loader";
import ContactsSkeletonPage from "./Layouts/HomeSkeleton";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    loader: loadContacts,
    HydrateFallback: ContactsSkeletonPage,
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

Y con esto ya tenemos una pantalla de carga. Lo mejor es que esto se puede aplicar por página, y cada una carga de forma independiente sin bloquear a las demás.

Esto lo veremos en más detalle en el siguiente post sobre loaders.
Sin duda, es una de las partes más importantes y potentes de React Router, y lo será aún más cuando lo combinemos con las _actions_.

¡Nos vemos en la [parte 4](https://dev.to/kevinccbsg/react-router-data-mode-parte-4-rutas-con-parametros-userouteloaderdata-y-useparams-4ccd)!
