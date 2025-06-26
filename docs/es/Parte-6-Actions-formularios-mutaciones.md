Continuamos con la sexta entrega de esta serie sobre React Router Data Mode. En esta ocasión hablaremos sobre las **actions**: una de las piezas clave para el manejo de datos que nos ofrece React Router.

---

Si vienes del [post anterior](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/es/Parte-5-refactor-useParams-y-NavLink.md), puedes continuar con tu proyecto tal cual. Pero si prefieres empezar limpio o asegurarte de estar en el punto exacto, ejecuta los siguientes comandos:

```bash
# Enlace del repositorio https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 05-action-create-contact
```

## ¿Qué es una action?

Una **action** es una función que podemos asociar a una ruta, y que se encarga de realizar **mutaciones de datos**. Lo interesante es que, al completarse, **React Router revalida automáticamente los datos** de la interfaz sin que tengamos que manejar ese proceso manualmente.

En nuestro proyecto de contactos, vamos a comenzar por crear un nuevo contacto usando una action. Verás que al hacerlo, el listado se actualizará sin necesidad de escribir lógica adicional.

---

## Manejo de formularios

En `src/pages/ContactForm.tsx` reemplazamos la etiqueta `<form>` por el componente `<Form>` de `react-router`, que es el encargado de disparar la action correspondiente al hacer submit.

Además, es importante indicar el método (por ejemplo, `POST`):

```tsx
<Form className="space-y-4" method="POST">
```

Este componente ejecutará la action definida en la ruta correspondiente. Para ello, configuramos la action en `src/AppRoutes.tsx`.

Un ejemplo tomado de la documentación oficial sería:

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

Al igual que hicimos con los loaders, lo recomendable es extraer la action a un archivo aparte.

Creamos `src/pages/actions.tsx` con lo siguiente:

```tsx
import { ActionFunctionArgs } from "react-router";

export const newContactAction = async ({ request }: ActionFunctionArgs) => {
  console.log('Llamando a la action');
  return null;
};
```

Esta función recibe un objeto con `ActionFunctionArgs`. Nos centraremos en `request`, aunque también podemos acceder a los `params` de la ruta.

> **Nota**: una action siempre debe retornar algo, ya sea null o una redirección (que veremos más adelante).

En `src/AppRoutes.tsx`, configuramos la action en la ruta `contacts/new` así:

```tsx
{
  path: "contacts/new",
  action: newContactAction,
  Component: ContactForm,
}
```

Al probar el formulario en la web, deberías ver el `console.log` en tu consola, indicando que la action se ejecutó correctamente.

---

## Obteniendo datos del formulario

Usamos `request.formData()` para capturar los datos, gracias a que nuestros inputs ya están bien etiquetados con `name`.

```ts
const formData = await request.formData();
const newContact= {
  firstName: formData.get('firstName') as string,
  lastName: formData.get('lastName') as string,
  username: formData.get('username') as string,
  email: formData.get('email') as string,
  phone: formData.get('phone') as string,
  avatar: formData.get('avatar') as string || undefined,
};
```

Además, validamos que el método sea `POST`:

```ts
const method = request.method.toUpperCase();
if (method === 'POST') {
  // create the contact
}
return null;
```
---

## Action final

El código completo de nuestra action quedaría así:

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

Al crear un nuevo contacto, este se mostrará automáticamente en el sidebar.

---

## Redirección tras crear

Ahora vamos a mejorar la experiencia redirigiendo directamente a la página del nuevo contacto. Usamos el helper `redirect` de `react-router` justo después de crear el contacto:

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

## Gestión del loading

Para gestionar el estado del formulario mientras se está enviando o cargando, usamos el hook `useNavigation` que nos ofrece React Router. Este hook nos da información sobre la navegación actual, y lo aprovechamos para saber si estamos enviando el formulario o esperando que se actualice la UI después del `redirect`.

```tsx
const navigation = useNavigation();
```

Con esto tenemos acceso al estado de la navegación actual, que puede ser `"idle"`, `"submitting"` o `"loading"`.

Luego creamos dos variables para detectar si estamos justo enviando este formulario en particular (no cualquier otro) o si estamos esperando que se recargue la vista tras completarse:

```tsx
const isSubmitting = navigation.state === 'submitting' && navigation.formAction === '/contacts/new';
const isLoading = navigation.state === 'loading' && navigation.formAction === '/contacts/new';
```

Esto es importante porque puede haber otras rutas o formularios en la app, y no queremos que se deshabilite el botón si no es este el formulario que se está usando.

Por último, combinamos ambos estados para saber si el botón debe estar deshabilitado:

```tsx
const disabled = isSubmitting || isLoading;
```

Así evitamos que el usuario envíe múltiples veces mientras el contacto se está creando o la UI se está actualizando.

Este sería el resultado:

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
        {/* tus campos */}
        <Button type="submit" disabled={disabled }>
          {disabled ? 'Creating...' : 'Create Contact'}
        </Button>
      </Form>
    </div>
  );
};

export default ContactForm;
```

Con esto conseguimos una mejor UX y evitamos múltiples submits innecesarios.

---

## Conclusión

Hasta aquí esta sexta parte, donde hemos creado una action, manejado el formulario, redirigido tras el submit y controlado el loading.

Quizá te preguntes: ¿qué pasa con la validación? ¿y si tengo varias actions en una misma página, como editar o borrar contactos?

Todo eso lo veremos en la próxima entrega: **cómo gestionar múltiples actions, validaciones y acciones que no dependen de un** `<Form>`.

¡Nos vemos en la [siguiente](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/es/Parte-7-M%C3%BAltiples-acciones-y-manejo-de-formularios.md)!
