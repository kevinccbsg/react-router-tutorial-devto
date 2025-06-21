import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, useActionData, useNavigation } from 'react-router';
import { newContactAction } from './actions';

const ContactForm = () => {
  const navigation = useNavigation();
  const actionData = useActionData<typeof newContactAction>();
  console.log('actionData', actionData);
  
  const isSubmitting = navigation.state === 'submitting' && navigation.formAction === '/contacts/new';
  const isLoading = navigation.state === 'loading' && navigation.formAction === '/contacts/new';
  const disabled = isSubmitting || isLoading;
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Contact</h1>
      <Form className="space-y-4" method="POST" noValidate>
        {actionData?.error && (
          <div className="text-red-500 mb-4">
            {actionData.error}
          </div>
        )}
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
        <Button type="submit" disabled={disabled}>
          {disabled ? 'Creating...' : 'Create Contact'}
        </Button>
      </Form>
    </div>
  );
};

export default ContactForm;