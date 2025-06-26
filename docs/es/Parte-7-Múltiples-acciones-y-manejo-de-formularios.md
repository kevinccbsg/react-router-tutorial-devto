Continuamos con la séptima entrega de esta serie sobre React Router Data Mode. En esta ocasión, profundizaremos en el uso de las _action_ y cómo gestionar múltiples mutaciones dentro de una misma página: la página de detalle de un contacto.

---

Si vienes del [post anterior](https://dev.to/kevinccbsg/react-router-data-mode-parte-6-actions-formularios-y-mutaciones-5354), puedes continuar con tu proyecto tal cual. Pero si prefieres empezar limpio o asegurarte de estar en el punto exacto, ejecuta los siguientes comandos:

```bash
# Enlace del repositorio https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 06-multiple-actions
```

## Revisar nuestro componente de detalle

En nuestra página de detalle `src/pages/ContactDetail.tsx`, teníamos un componente llamado `ContactCard`.

Si revisamos ese componente, veremos que ya incluye dos formularios: uno para eliminar el contacto y otro para marcarlo como favorito. Ambos formularios envuelven botones `submit` que ejecutan sus respectivas acciones:

```tsx
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
```

Ahora bien, ¿por qué tenemos dos formularios?
Si queremos aprovechar el manejo de datos que ofrece React Router, necesitamos que nuestras mutaciones lleguen a una `action`, y para eso deben ir dentro de un componente `Form` de `react-router`.

Pero, si tenemos múltiples formularios, ¿cómo sabemos qué acción ejecutar? Existen varias estrategias:

- Podemos usar el method, como en el ejemplo, para indicar si es POST, PATCH, PUT o DELETE.
- Podemos incluir un input tipo hidden para especificar el tipo de acción deseada. Por ejemplo: `<input type="hidden" name="actionType" value="toggleFavorite" />`

Además, notarás que usamos un input oculto con `name="id"` para enviar el ID del contacto. Esto nos permite acceder a ese valor dentro de la action y así realizar operaciones como eliminar o actualizar en la API.
Este patrón no es nuevo, es parte del funcionamiento clásico de los formularios HTML. Más info aquí → [MDN - input hidden](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/hidden)

## Nuestra action

Una vez que tenemos los formularios listos, debemos conectar la ruta con su `action`. Vamos a crearla en `src/pages/action.ts`:

```tsx
export const contactDetailActions = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const method = request.method.toUpperCase();

  if (method === 'DELETE') {
    const id = formData.get("id") as string;
    await deleteContact(id);
    return redirect("/");
  } else if (method === 'PATCH') {
    const id = formData.get("id") as string;
    const favorite = formData.get("favorite") === "true";
    await updateFavoriteStatus(id, favorite);
    return null;
  }
  return null;
};
```

Como puedes ver, al igual que en la creación de un nuevo contacto, obtenemos los datos desde `request.formData()`.
El ID lo podemos recuperar porque lo incluimos como input oculto.

Luego, en `src/AppRoutes.tsx`, configuramos la ruta para que use esta `action`:

```ts
{
  path: "contacts/:contactId",
  action: contactDetailActions,
  Component: ContactDetail,
}
```

Con esto, ya deberían funcionar ambas acciones correctamente.

## Un poco de refactor

Podemos refactorizar la action para evitar anidar varios `if/else`, usando un objeto handlers:

```tsx
import { ActionFunctionArgs, redirect } from "react-router";
import { createContact, deleteContact, updateFavoriteStatus } from "@/api/contacts";

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

  const handlers: Record<string, () => Promise<Response | null>> = {
    POST: async () => {
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
    },
  };

  if (handlers[method]) {
    return handlers[method]();
  }

  return null;
};

export const contactDetailActions = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const method = request.method.toUpperCase();

  const handlers: Record<string, () => Promise<Response | null>> = {
    DELETE: async () => {
      const id = formData.get("id") as string;
      await deleteContact(id);
      return redirect("/");
    },
    PATCH: async () => {
      const id = formData.get("id") as string;
      const favorite = formData.get("favorite") === "true";
      await updateFavoriteStatus(id, favorite);
      return null;
    },
  };

  if (handlers[method]) {
    return handlers[method]();
  }

  return null;
};
```

---

Con esto ya tenemos una forma de gestionar múltiples `action` dentro de una misma página, algo muy común en aplicaciones reales. La estrategia específica que elijas dependerá de tu caso de uso, y en futuros posts exploraremos más opciones.

Pero probablemente te estés preguntando algunas cosas:

- **¿Tengo que poner un form en cada botón?**
Normalmente harías esto con un `onClick`. En el próximo post veremos cómo usar `useFetcher` para este tipo de casos.

- **¿Cómo puedo validar los datos del formulario?**
Lo veremos en el próximo post.

- **¿Por qué al eliminar o actualizar hay un pequeño delay?**
Ese delay lo agregamos a propósito para simular un comportamiento lento de un API. Más adelante hablaremos de cómo mejorar la experiencia usando técnicas como Optimistic UI.

Nos vemos en la [siguiente entrega](https://dev.to/kevinccbsg/react-router-data-mode-parte-8-validaciones-usefetcher-y-react-hook-form-4e5p). Este post cubre uno de los conceptos más importantes de la serie, pero aún quedan muchos temas interesantes por explorar.
