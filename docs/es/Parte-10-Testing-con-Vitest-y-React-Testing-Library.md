Llegamos a la **última entrega** de esta serie sobre React Router Data Mode. En este episodio hablaremos de **testing**, una de las partes más importantes del desarrollo —y una de las más olvidadas.

En este caso lo hemos dejado para el final, pero en un proyecto real deberíamos incorporar tests **desde el principio**.

Este post está organizado en 4 bloques:

1. Setup del entorno de testing
2. Test de la página de contactos
3. Test de formularios
4. Test de la vista de detalle y Optimistic UI

Si vienes del [post anterior](https://dev.to/kevinccbsg/react-router-data-mode-parte-9-optimistic-ui-con-usefetcher-dmb), puedes continuar con tu proyecto tal cual. Pero si prefieres empezar limpio o asegurarte de estar en el punto exacto, ejecuta los siguientes comandos:

```bash
# Enlace del repositorio https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 09-testing
```

## 1. Setup del entorno de testing

Aquí te indico directamente qué dependencias instalar y qué archivos modificar. Si quieres una explicación más detallada, puedes consultar este otro [post dedicado al setup](https://dev.to/kevinccbsg/react-testing-setup-vitest-typescript-react-testing-library-42c8).

Instalamos:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/dom @types/react @types/react-dom @testing-library/jest-dom @testing-library/user-event
```

Modificamos `vite.config.ts`:

```ts
/// <reference types="vitest" />
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
    exclude: [...configDefaults.exclude],
  },
  server: {
    watch: {
      ignored: ["**/data/data.json"],
    },
  },
})
```

Y el `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"],
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": ["src"]
}
```

Añadir el script `"test": "vitest",` con el que haciendo uso del comando `npm test` vemos la ejecución de nuestros tests.

---

## 2. Test de la página de contactos


Creamos el archivo `src/tests/contacts.spec.tsx` y usamos `createRoutesStub `de `react-router` para definir las rutas a testear:

```tsx
import { createRoutesStub } from "react-router";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ContactsPage from "@/pages/Contacts";
import { Contact } from "@/api/contacts";
import ContactsSkeletonPage from "@/Layouts/HomeSkeleton";

test("Home page render new button", async () => {
  const Stub = createRoutesStub([
    {
      path: "/",
      Component: ContactsPage,
      HydrateFallback: ContactsSkeletonPage,
      loader() {
        return {
          contacts: [],
        };
      },
    },
  ]);

  // render the app stub at "/login"
  render(<Stub initialEntries={["/"]} />);
  await waitFor(() => screen.findByText('New'));
});
```

Este tipo de tests nos permite comprobar el comportamiento de la UI sin necesidad de montar toda la aplicación.

Podemos también simular que hay contactos disponibles:

```tsx
test("Home render sidebar contacts", async () => {
  const Stub = createRoutesStub([
    {
      path: "/",
      Component: ContactsPage,
      HydrateFallback: ContactsSkeletonPage,
      loader() {
        const contacts: Contact[] = [
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
          ];
        return { contacts };
      },
    },
  ]);
  // render the app stub at "/"
  render(<Stub initialEntries={["/"]} />);
  // check fallback skeleton is rendered
  const mainPanelSkeleton = screen.getByTestId("main-panel-skeleton");
  expect(mainPanelSkeleton).toBeInTheDocument();
  await waitFor(() => screen.findByText('Jane Doe'));
  await waitFor(() => screen.findByText('John Smith'));
  // check skeleton is not rendered
  const mainPanelSkeletonAfterLoad = screen.queryByTestId("main-panel-skeleton");
  expect(mainPanelSkeletonAfterLoad).not.toBeInTheDocument();
});
```

No necesitas testear directamente el loader, lo importante es **testear la UI y sus diferentes estados**. Evita añadir complejidad innecesaria.

---

## 3. Test Formulario de contacto

En este tipo de test **no necesitamos cargar un loader**, por lo que es importante **centrarnos en qué sí tiene sentido probar** desde el punto de vista de la UI.

Nos interesa validar:

- Que los campos del formulario existen y se pueden completar
- Que la validación se muestra correctamente si faltan campos

**¿Y la action?**

No, **no es necesario testear la action aquí**. Al igual que con los `loaders`, estamos haciendo tests de interfaz. Las `actions` y `loaders` pueden (y deben) testearse por separado si queremos validar su lógica. Si lo que queremos es testear todo el flujo completo, eso ya se convierte en un test tipo e2e con herramientas como Cypress o Playwright.

La idea aquí es mantener los tests **simples y de mantenimiento fácil**, centrados en la UI.

```tsx
import { createRoutesStub } from "react-router";
import {
  render,
  screen,
} from "@testing-library/react";
import ContactForm from "@/pages/ContactForm";
import userEvent from "@testing-library/user-event";

test("ContactForm shows validation errors on submit", async () => {
  const user = userEvent.setup();

  const Stub = createRoutesStub([
    {
      path: "/",
      Component: ContactForm,
    },
  ]);

  // render the app stub at "/"
  render(<Stub initialEntries={["/"]} />);

  // submit the form without filling any fields
  const submitButton = screen.getByRole("button", { name: /create contact/i });
  await user.click(submitButton);
  // check for validation errors
  expect(screen.getByText("First name is required")).toBeInTheDocument();
  expect(screen.getByText("Last name is required")).toBeInTheDocument();
});
```

También puedes comprobar que, con datos válidos, no hay errores:

```tsx
test("ContactForm submits valid data", async () => {
  const user = userEvent.setup();
  const Stub = createRoutesStub([
    {
      path: "/",
      Component: ContactForm,
    },
  ]);
  // render the app stub at "/"
  render(<Stub initialEntries={["/"]} />);
  // fill the form with valid data
  await user.type(screen.getByLabelText("First Name"), "John");
  await user.type(screen.getByLabelText("Last Name"), "Doe");
  await user.type(screen.getByLabelText("Username"), "john_doe");
  await user.type(screen.getByLabelText("Email"), "test@test.com");
  await user.type(screen.getByLabelText("Phone"), "1234567890");
  await user.type(screen.getByLabelText("Avatar (Optional)"), "https://example.com/avatar.jpg");
  // submit the form
  const submitButton = screen.getByRole("button", { name: /create contact/i });
  await user.click(submitButton);
  // check validation errors not present
  expect(screen.queryByText("First name is required")).not.toBeInTheDocument();
});
```

---

## 4. Test detalle y del optimistic UI

La página de detalle de contacto es interesante porque se trata de una página anidada dentro de `Contacts`. Podríamos testearla por separado, pero lo más realista es simular su comportamiento anidado con un `Stub` que incluya `children` y `action`.

```tsx
const Stub = createRoutesStub([
  {
    path: "/",
    id: "root",
    Component: ContactsPage,
    HydrateFallback: ContactsSkeletonPage,
    loader() {
      const contacts: Contact[] = [
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
        ];
      return { contacts };
    },
    children: [
      {
      path: "contacts/:contactId",
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return null;
      },
      Component: ContactDetail,
      }
    ],
  },
]);
```
> El delay en la action simula una llamada real al backend, permitiendo testear correctamente el comportamiento optimista de la UI (Optimistic UI).

**Mejora de accesibilidad**

Para poder testear con `react-testing-library`, necesitamos usar selectores accesibles. Por eso, debemos añadir `aria-label` a los iconos en `ContactCard.tsx`:

```tsx
<Button type="submit" variant="ghost" disabled={optimisticToggleFav} data-testid="toggle-favorite">
    {optimisticToggleFav
    ? (!favorite ? <Star className="w-4 h-4" aria-label="Favorite" /> : <StarOff className="w-4 h-4" aria-label="Not Favorite" />)
    : (favorite ? <Star className="w-4 h-4" aria-label="Favorite" /> : <StarOff className="w-4 h-4" aria-label="Not Favorite" />)
    }
</Button>
```

Nuestro test quedaría de la siguiente manera:

```tsx
test("should optimistically toggle favorite icon on click", async () => {
  const user = userEvent.setup();
  const Stub = createRoutesStub([
    {
      path: "/",
      id: "root",
      Component: ContactsPage,
      HydrateFallback: ContactsSkeletonPage,
      loader() {
        const contacts: Contact[] = [
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
          ];
        return { contacts };
      },
      children: [
        {
        path: "contacts/:contactId",
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return null;
        },
        Component: ContactDetail,
        }
      ],
    },
  ]);

  // render the app stub at "/"
  render(<Stub initialEntries={["/contacts/1"]} />);
  // wait for the contact detail to load
  await waitFor(() => screen.findByText('jane_doe'));
  // check if the toggle-favorite button is present
  const favoriteButton = screen.getByLabelText("Favorite");
  await user.click(favoriteButton);
  // simulate optimistic UI: the icon should change immediately after click, before server action completes
  expect(screen.getByLabelText("Not Favorite")).toBeInTheDocument();
  // assert button is disabled during optimistic transition
  const toggleFavFetcher = screen.getByTestId("toggle-favorite");
  expect(toggleFavFetcher).toBeDisabled();
});
```

Este test valida directamente que el estado Favorito **cambia antes de que termine la petición**, lo que demuestra que el patrón de Optimistic UI está funcionando correctamente.

---

## Conclusión

Con esto terminamos la serie de **React Router Data Mode**. Has visto cómo usar `loaders`, `actions`, `useFetcher`, optimistic UI y cómo testear toda esta lógica de forma sencilla.

Aunque esta serie cubre lo esencial, hay muchos temas más que se pueden explorar:

- Rutas anidadas complejas, lazy loading, paginación, autenticación, modo framework...

Próximamente comenzaremos una nueva serie: React Router con Supabase, donde aplicaremos todo esto en una app real con base de datos y auth.

Gracias por acompañarme hasta aquí. ¡Nos vemos en la siguiente serie!
