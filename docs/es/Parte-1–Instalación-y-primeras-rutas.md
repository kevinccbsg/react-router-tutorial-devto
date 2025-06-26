en esta serie nos vamos a centrar en el **modo Data**, que sin duda es mi favorito para crear SPAs bien estructuradas y mantenibles.

Esta serie tendrá varias partes, que puedes ver a continuación:

1. [Instalación y primeras rutas](https://dev.to/kevinccbsg/react-router-data-mode-parte-1-instalacion-y-primeras-rutas-ok9/edit)
2. [Rutas anidadas y Outlet](https://dev.to/kevinccbsg/react-router-data-mode-parte-2-rutas-anidadas-y-outlets-4i17)
3. [Loaders](https://dev.to/kevinccbsg/react-router-data-mode-parte-3-loaders-y-carga-de-datos-3bn1)
4. [Rutas con parámetros, useRouteLoaderData y useParams](https://dev.to/kevinccbsg/react-router-data-mode-parte-4-rutas-con-parametros-userouteloaderdata-y-useparams-4ccd)
5. [useParams, Navlink](https://dev.to/kevinccbsg/react-router-data-mode-parte-5-refactor-useparams-y-navlink-1bbe)
6. [Actions](https://dev.to/kevinccbsg/react-router-data-mode-parte-6-actions-formularios-y-mutaciones-5354)
7. [Múltiples acciones y manejo de formularios en una sola página](https://dev.to/kevinccbsg/react-router-data-mode-parte-7-multiples-acciones-y-manejo-de-formularios-en-una-sola-pagina-4bm9)
8. [Validación de formularios y uso de fetcher](https://dev.to/kevinccbsg/react-router-data-mode-parte-8-validaciones-usefetcher-y-react-hook-form-4e5p)
9. [Optimistic UI con useFetcher](https://dev.to/kevinccbsg/react-router-data-mode-parte-9-optimistic-ui-con-usefetcher-dmb)
10. [Testing con Vitest y React Testing Library](https://dev.to/kevinccbsg/react-router-data-mode-parte-10-testing-con-vitest-y-react-testing-library-38ba)

Todas las partes estarán explicadas en este repositorio, que ya viene preparado con algunos componentes y librerías de estilos como **shadcn/ui** y **Tailwind**.

---

## ¿Qué vamos a construir?

Una aplicación de contactos en la que pondremos en práctica rutas anidadas, carga y mutación de datos, navegación, validaciones, etc.

![web de contactos para la demo de react router](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/n6xpdv53npyen4bqoj8w.gif)

¡Vamos a empezar!

## Instalación y primeras rutas

Lo primero es clonar el [repositorio base](https://github.com/kevinccbsg/react-router-tutorial-devto).

En tu terminal:

```bash
git clone git@github.com:kevinccbsg/react-router-tutorial-devto.git
# movemos al tag inicial
git checkout 00-init-project
```

Instalamos las dependencias:

```bash
npm i
```

Este proyecto está creado con **Vite** y tiene integrada la librería de **shadcn/ui**. Esa parte no la explicaremos aquí, pero si quieres un tutorial de Vite + shadcn, déjamelo en los comentarios.

Ahora arrancamos el proyecto:

```bash
npm run dev
```

Verás en pantalla algo muy simple: un `<h1>` con el texto "Welcome to React!". Vamos a cambiar eso y comenzar a usar **React Router (modo Data)**.

## Instalar React Router

Ejecutamos:

```
npm i react-router
```

Creamos un archivo nuevo llamado `src/AppRoutes.tsx`, que contendrá nuestra configuración de rutas:

```tsx
import { createBrowserRouter } from "react-router";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    element: <div>Home</div>,
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

A diferencia del modo Declarativo (donde usamos `<Routes>` y `<Route>`), en el modo Data definimos las rutas como objetos. Cada objeto representa una ruta y puede incluir elementos como `element`, `loader`, `action`, etc.

En este ejemplo:

- `/` muestra un simple "Home"
- `/about` muestra "About"
- `*` captura cualquier ruta no definida (lo que React Router llama un "splat") y muestra "Not Found"

## Conectar el router con React

Para que React Router se active, debemos conectarlo en el `main.tsx`. Editamos el archivo así:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router";
import router from './AppRoutes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

¡Listo! Si visitas `/`, `/about` o cualquier otra ruta, deberías ver el contenido correspondiente.

## ¿Qué sigue?

En la siguiente parte vamos a construir la estructura real de la aplicación, ver cómo se usan los `Outlet` para anidar rutas, los `Link` y crear un layout base.

Nos vemos en la [parte 2](https://dev.to/kevinccbsg/react-router-data-mode-parte-2-rutas-anidadas-y-outlets-4i17).
