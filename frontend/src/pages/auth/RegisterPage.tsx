import { Form, Input, Button, Card, Typography, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useAuth';
import type { RegisterRequest } from '../../types/auth';

interface FormValues extends RegisterRequest {
  confirm_password: string;
}

export default function RegisterPage() {
  const { mutate: register, isPending } = useRegister();
  const [form] = Form.useForm<FormValues>();

  const onFinish = ({ confirm_password: _, ...values }: FormValues) => {
    register(values);
  };

  return (
    <Card style={{ width: '100%', maxWidth: 460 }}>
      <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
        Créer un compte
      </Typography.Title>

      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <Form.Item
          name="prenom"
          label="Prénom"
          rules={[{ required: true, message: 'Le prénom est obligatoire.' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Votre prénom" />
        </Form.Item>

        <Form.Item
          name="nom"
          label="Nom"
          rules={[{ required: true, message: 'Le nom est obligatoire.' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Votre nom" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Adresse email"
          rules={[
            { required: true, message: 'L\'email est obligatoire.' },
            { type: 'email', message: 'Format d\'email invalide.' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="votre@email.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mot de passe"
          rules={[
            { required: true, message: 'Le mot de passe est obligatoire.' },
            { min: 8, message: 'Minimum 8 caractères.' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Minimum 8 caractères" />
        </Form.Item>

        <Form.Item
          name="confirm_password"
          label="Confirmer le mot de passe"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Confirmez votre mot de passe.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('Les mots de passe ne correspondent pas.'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Répétez votre mot de passe" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 12 }}>
          <Button type="primary" htmlType="submit" loading={isPending} block size="large">
            Créer mon compte
          </Button>
        </Form.Item>
      </Form>

      <Divider style={{ margin: '12px 0' }} />
      <Typography.Text style={{ display: 'block', textAlign: 'center' }}>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </Typography.Text>
    </Card>
  );
}
