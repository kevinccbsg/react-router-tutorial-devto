We’ve reached the **final installment** of this series on React Router Data Mode. In this episode, we’ll talk about **testing**—one of the most important (and often neglected) parts of development.

In this case, we’ve left it for last, but in a real project, you should incorporate tests **from the very beginning**.

This post is organized into 4 sections:

1. Setting up the testing environment
2. Testing the contacts page
3. Testing forms
4. Testing the detail view and Optimistic UI

If you’re coming from the [previous post](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/en/Part-9-Optimistic-UI-useFetcher.md), you can continue with your project as is. But if you prefer to start fresh or make sure you’re at the right point, run the following commands:

```bash
# Repository link https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 09-testing
```

## 1. Setting up the testing environment

Here’s exactly which dependencies to install and which files to modify. For a more detailed explanation, check out this [dedicated setup post](https://dev.to/kevinccbsg/react-testing-setup-vitest-typescript-react-testing-library-42c8).

Install:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/dom @types/react @types/react-dom @testing-library/jest-dom @testing-library/user-event
```

Modify `vite.config.ts`:

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

And `tsconfig.app.json`:

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

Add the script `"test": "vitest",` so you can run your tests with `npm test`.

---

## 2. Testing the contacts page

Create the file `src/tests/contacts.spec.tsx` and use `createRoutesStub` from `react-router` to define the routes to test:

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

These kinds of tests let you check UI behavior without mounting the entire app.

You can also simulate having available contacts:

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

You don’t need to test the loader directly; the important thing is to **test the UI and its different states**. Avoid unnecessary complexity.

---

## 3. Testing the contact form

For this kind of test, **you don’t need to load a loader**—focus on what makes sense to test from the UI perspective.

You want to validate:

- That the form fields exist and can be filled
- That validation is shown correctly if fields are missing

**What about the action?**

No, **you don’t need to test the action here**. Just like with `loaders`, we’re doing interface tests. `actions` and `loaders` can (and should) be tested separately if you want to validate their logic. If you want to test the entire flow, that’s more of an e2e test with tools like Cypress or Playwright.

The idea here is to keep tests **simple and easy to maintain**, focused on the UI.

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

You can also check that with valid data, there are no errors:

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

## 4. Testing the detail view and optimistic UI

The contact detail page is interesting because it’s a nested page inside `Contacts`. You could test it separately, but it’s more realistic to simulate its nested behavior with a `Stub` that includes `children` and `action`.

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
> The delay in the action simulates a real backend call, allowing you to properly test the optimistic UI behavior.

**Accessibility improvement**

To test with `react-testing-library`, you need to use accessible selectors. So, add `aria-label` to the icons in `ContactCard.tsx`:

```tsx
<Button type="submit" variant="ghost" disabled={optimisticToggleFav} data-testid="toggle-favorite">
    {optimisticToggleFav
    ? (!favorite ? <Star className="w-4 h-4" aria-label="Favorite" /> : <StarOff className="w-4 h-4" aria-label="Not Favorite" />)
    : (favorite ? <Star className="w-4 h-4" aria-label="Favorite" /> : <StarOff className="w-4 h-4" aria-label="Not Favorite" />)
    }
</Button>
```

Your test would look like this:

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

This test directly validates that the Favorite state **changes before the request finishes**, demonstrating that the Optimistic UI pattern is working correctly.

---

## Conclusion

That wraps up the **React Router Data Mode** series. You’ve seen how to use `loaders`, `actions`, `useFetcher`, optimistic UI, and how to test all this logic simply.

While this series covers the essentials, there are many more topics to explore:

- Complex nested routes, lazy loading, pagination, authentication, framework mode...

Soon we’ll start a new series: React Router with Supabase, where we’ll apply all this in a real app with database and auth.

Thanks for following along. See you in the next series!
