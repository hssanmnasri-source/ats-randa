import { Alert } from 'antd';

interface Props {
  message?: string;
  description?: string;
}

export default function ErrorAlert({ message = 'Une erreur est survenue.', description }: Props) {
  return (
    <Alert
      type="error"
      message={message}
      description={description}
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
}
