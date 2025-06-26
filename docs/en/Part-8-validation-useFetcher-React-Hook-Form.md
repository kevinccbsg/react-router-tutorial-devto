We continue with the **eighth installment** of this series on **React Router Data Mode**.
This time, we'll answer two questions left pending from the previous post:

- Do I need to put a form on every button?
- How can I validate form data?

To answer them, we'll look at different ways to validate data in an `action`. We'll also talk about one of the most useful and important hooks in React Router: `useFetcher`.

---

If you're coming from the [previous post](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/en/Part-7-multiple-actions-forms.md), you can continue with your project as is. But if you prefer to start fresh or make sure you're at the exact point, run the following commands:

```bash
# Repository link https://github.com/kevinccbsg/react-router-tutorial-devto
git reset --hard
git clean -d -f
git checkout 07-form-validation
```

## Validation in the action

We'll work with the contact creation form in `src/pages/ContactForm.tsx`.

First, disable the browser's default validation by adding `noValidate` to the form tag:

```tsx
<Form className="space-y-4" method="POST" noValidate>
```

This way, React Router lets us fully control validation from our action. We can do it manually with `if/else`, or use a library like `zod` or `yup`.

**Important**: we don't use throw to raise errors, as that would trigger an `ErrorBoundary`, which we haven't defined yet. In this case, we'll return an object with the error information.

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
      // Add any validation you want: zod, if-else, yup
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

Now in the UI we can access the error returned from the action using `useActionData`:

```tsx
const actionData = useActionData<typeof newContactAction>();
```

And display it in the component:

```tsx
{actionData?.error && (
  <div className="text-red-500 mb-4">
     {actionData.error}
  </div>
)}
```

Resulting in something like this:

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
        {/* other fields */}
        <Button type="submit" disabled={disabled}>
          {disabled ? 'Creating...' : 'Create Contact'}
        </Button>
      </Form>
    </div>
  );
};

export default ContactForm;
```

This allows us to show errors without reloading the page, but we lose many immediate validation advantages offered by libraries like `react-hook-form`. And since `Form` doesn't let us intercept `onSubmit`, this is where `useFetcher` comes in.

## What is useFetcher?

According to the official documentation:

> "Fetcher is useful for creating dynamic and complex interfaces that require multiple concurrent data interactions, without causing navigation."
> "Fetchers have their own independent state and can be used to load data, submit forms, and interact with loaders and actions."

Let's migrate our form to use `useFetcher`.

## Migrating to useFetcher

Here's how the component would look using `fetcher.Form`:

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
        {/* other fields */}
        <Button type="submit" disabled={disabled}>
          {disabled ? 'Creating...' : 'Create Contact'}
        </Button>
      </fetcher.Form>
    </div>
  );
};

export default ContactForm;
```

With this, you no longer need `useActionData` or `useNavigation`, since fetcher gives you direct access to the submission state and returned data.

## Validation with react-hook-form + useFetcher

If you want a better client-side validation experience, you can use `react-hook-form`.

First, install the library:

```bash
npm install react-hook-form
```

Since we'll handle `onSubmit` manually, we don't need `fetcher.Form` or `Form`. Just use `fetcher.submit()` in the `handleSubmit`.

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

With this, you can take advantage of everything `react-hook-form` offers (real-time validation, per-field errors, etc.) and still use React Router actions to manage the data.


## Conclusion

In this post we saw:

- How to do validations in React Router `actions`
- How to display errors with `useActionData` or directly from fetcher
- What `useFetcher` is and how it lets us work with forms without changing routes
- How to integrate `react-hook-form` with Data Mode

---

## In the next post...

We'll apply `useFetcher` to delete and favorite actions, and talk about a super interesting concept: **Optimistic UI**.
This will let us improve the user experience with instant updates before the server confirms the operation.

See you in the [next post](https://github.com/kevinccbsg/react-router-tutorial-devto/blob/main/docs/en/Part-9-Optimistic-UI-useFetcher.md)!
