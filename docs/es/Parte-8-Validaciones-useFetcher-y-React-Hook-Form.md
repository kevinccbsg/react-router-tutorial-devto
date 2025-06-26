Continuamos con la **octava entrega** de esta serie sobre **React Router Data Mode**.
En esta ocasión, vamos a responder dos preguntas que quedaron pendientes en el post anterior:

- ¿Tengo que poner un form en cada botón?
- ¿Cómo puedo validar los datos del formulario?

Para responderlas, veremos las diferentes formas de validar datos en una `action`. También hablaremos de uno de los hooks más útiles e importantes de React Router: `useFetcher`.

---

Si vienes del [post anterior](https://dev.to/kevinccbsg/react-router-data-mode-parte-7-multiples-acciones-y-manejo-de-formularios-en-una-sola-pagina-4bm9), puedes continuar con tu proyecto tal cual. Pero si prefieres empezar limpio o asegurarte de estar en el punto exacto, ejecuta los siguientes comandos:

```bash
# Enlace del repositorio https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 07-form-validation
```

## Validación en la action

Vamos a trabajar con el formulario de creación de un contacto en `src/pages/ContactForm.tsx`.

Primero, desactivamos la validación por defecto del navegador añadiendo `noValidate` en la etiqueta del formulario:

```tsx
<Form className="space-y-4" method="POST" noValidate>
```

Así React Router nos permite controlar completamente la validación desde nuestra action. Podemos hacerlo manualmente con `if/else`, o usando una librería como `zod` o `yup`.

**Importante**: no usamos throw para lanzar errores, ya que eso activaría un `ErrorBoundary`, que aún no hemos definido. En este caso, devolveremos un objeto con la información del error.

```tsx
export const newContactAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const method = request.method.toUpperCase();

  const handlers: Record<string, () => Promise<Response | { error: string; }>> = {
    POST: async () => {
      const newContact: NewContact = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        avatar: formData.get('avatar') as string || undefined,
      };
      // Añadir la validación que quieras zod, if-else, yup
      if (!newContact.firstName) {
        return { error: "First name is required." };
      }
      const newContactResponse = await createContact(newContact);
      return redirect(`/contacts/${newContactResponse.id}`);
    },
  };

  if (handlers[method]) {
    return handlers[method]();
  }

  return null;
};
```

Ahora en la UI podemos acceder al error devuelto desde la action usando `useActionData`:

```tsx
const actionData = useActionData<typeof newContactAction>();
```

Y mostrarlo en el componente:

```tsx
{actionData?.error && (
  <div className="text-red-500 mb-4">
     {actionData.error}
  </div>
)}
```

Quedando de esta manera:

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, useActionData, useNavigation } from 'react-router';
import { newContactAction } from './actions';

const ContactForm = () => {
  const navigation = useNavigation();
  const actionData = useActionData<typeof newContactAction>();
  const isSubmitting = navigation.state === 'submitting' && navigation.formAction === '/contacts/new';
  const isLoading = navigation.state === 'loading' && navigation.formAction === '/contacts/new';
  const disabled = isSubmitting || isLoading;
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Contact</h1>
      <Form className="space-y-4" method="POST" noValidate>
        {/* show error message */}
        {actionData?.error && (
          <div className="text-red-500 mb-4">
            {actionData.error}
          </div>
        )}
        {/* los otros campos */}
        <Button type="submit" disabled={disabled}>
          {disabled ? 'Creating...' : 'Create Contact'}
        </Button>
      </Form>
    </div>
  );
};

export default ContactForm;
```

Esto nos permite mostrar errores sin recargar la página, pero perdemos muchas ventajas de validación inmediata que ofrecen librerías como `react-hook-form`. Y como `Form` no nos permite interceptar el `onSubmit`, es aquí donde entra en juego `useFetcher`.

## ¿Qué es useFetcher?

Según la documentación oficial:

> "Fetcher es útil para crear interfaces dinámicas y complejas que requieren múltiples interacciones con datos concurrentes, sin provocar una navegación."
> "Los fetchers tienen su propio estado independiente y pueden usarse para cargar datos, enviar formularios e interactuar con loaders y actions."

Vamos a migrar nuestro formulario para que use `useFetcher`.

## Migrar a useFetcher

Aquí tienes cómo quedaría el componente usando `fetcher.Form`:

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFetcher } from 'react-router';
import { newContactAction } from './actions';

const ContactForm = () => {
  const fetcher = useFetcher<typeof newContactAction>();
  const disabled = fetcher.state === 'submitting' || fetcher.state === 'loading';
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Contact</h1>
      <fetcher.Form className="space-y-4" method="POST" noValidate>
        {fetcher.data?.error && (
          <div className="text-red-500 mb-4">
            {fetcher.data.error}
          </div>
        )}
        {/* los otros campos */}
        <Button type="submit" disabled={disabled}>
          {disabled ? 'Creating...' : 'Create Contact'}
        </Button>
      </fetcher.Form>
    </div>
  );
};

export default ContactForm;
```

Con esto ya no necesitas `useActionData` ni `useNavigation`, ya que fetcher te da acceso directo al estado del envío y a los datos devueltos.

## Validación con react-hook-form + useFetcher

Si quieres una mejor experiencia de validación en el lado del cliente, puedes usar `react-hook-form`.

Primero instalamos la librería:

```bash
npm install react-hook-form
```

Como vamos a manejar el `onSubmit` manualmente, no necesitamos `fetcher.Form` ni `Form`. Basta con usar `fetcher.submit()` en el `handleSubmit`.

```tsx
import { useForm, SubmitHandler } from "react-hook-form"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFetcher } from 'react-router';
import { newContactAction } from './actions';

interface FormValues {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string;
}

const ContactForm = () => {
  const fetcher = useFetcher<typeof newContactAction>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    fetcher.submit({ ...data }, { method: 'POST', action: '/contacts/new' });
  };
  const disabled = fetcher.state === 'submitting' || fetcher.state === 'loading';
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Contact</h1>
      <form className="space-y-4" method="POST" noValidate onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label className="mb-2" htmlFor="firstName">First Name</Label>
          <Input type="text" id="firstName" {...register("firstName", { required: true })} />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">
              First name is required
            </p>
          )}
        </div>
        <div>
          <Label className="mb-2" htmlFor="lastName">Last Name</Label>
          <Input type="text" id="lastName" {...register("lastName", { required: true })} />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">
              Last name is required
            </p>
          )}
        </div>
        <div>
          <Label className="mb-2" htmlFor="username">Username</Label>
          <Input type="text" id="username" {...register("username", { required: true })} />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">
              Username is required
            </p>
          )}
        </div>
        <div>
          <Label className="mb-2" htmlFor="email">Email</Label>
          <Input type="email" id="email" {...register("email", { required: true })} />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              Email is required
            </p>
          )}
        </div>
        <div>
          <Label className="mb-2" htmlFor="phone">Phone</Label>
          <Input type="tel" id="phone" {...register("phone", { required: true })} />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">
              Phone is required
            </p>
          )}
        </div>
        <div>
          <Label className="mb-2" htmlFor="avatar">Avatar (Optional)</Label>
          <Input type="url" id="avatar" {...register("avatar")} />
          {errors.avatar && (
            <p className="text-red-500 text-sm mt-1">
              Avatar URL is invalid
            </p>
          )}
        </div>
        <Button type="submit" disabled={disabled}>
          {disabled ? 'Creating...' : 'Create Contact'}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
```

Con eso puedes aprovechar todo lo bueno de `react-hook-form` (validación en tiempo real, errores por campo, etc.) y seguir usando las actions de React Router para gestionar los datos.


## Conclusión

En este post vimos:

- Cómo hacer validaciones en las `actions` de React Router
- Cómo mostrar errores con `useActionData` o directamente desde fetcher
- Qué es `useFetcher` y cómo nos permite trabajar con formularios sin cambiar de ruta
- Cómo integrar `react-hook-form` con el `Data Mode`

---

## En el próximo post...

Vamos a aplicar `useFetcher` a las acciones de borrado y marcado como favorito, y hablaremos de un concepto súper interesante: **Optimistic UI**.
Esto nos permitirá mejorar la experiencia del usuario con actualizaciones instantáneas antes de que el servidor confirme la operación.

¡Nos vemos en la [próxima entrega](https://dev.to/kevinccbsg/react-router-data-mode-parte-9-optimistic-ui-con-usefetcher-dmb)!
