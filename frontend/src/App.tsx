import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import MessageProvider from './components/common/MessageProvider';

export default function App() {
  return (
    <>
      <MessageProvider />
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </>
  );
}
