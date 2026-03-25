import { Form, Input, Button, Card, Typography, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useAuth';
import type { RegisterRequest } from '../../types/auth';

const { Title, Text } = Typography;

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
    <Card
      style={{
        width: '100%',
        maxWidth: 460,
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        border: '1px solid #C9A84C',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <img
          src="/logo-randa.png"
          style={{ width: 160, marginBottom: 12, objectFit: 'contain' }}
          alt="ATS RANDA"
        />
        <Title level={4} style={{ color: '#8B1A1A', margin: 0 }}>
          Créer un compte candidat
        </Title>
        <Text style={{ color: '#C9A84C', fontSize: 13 }}>
          Rejoignez ATS RANDA
        </Text>
      </div>

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
          <Input prefix={<UserOutlined style={{ color: '#8B1A1A' }} />} placeholder="Votre prénom" />
        </Form.Item>

        <Form.Item
          name="nom"
          label="Nom"
          rules={[{ required: true, message: 'Le nom est obligatoire.' }]}
        >
          <Input prefix={<UserOutlined style={{ color: '#8B1A1A' }} />} placeholder="Votre nom" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Adresse email"
          rules={[
            { required: true, message: "L'email est obligatoire." },
            { type: 'email', message: "Format d'email invalide." },
          ]}
        >
          <Input prefix={<MailOutlined style={{ color: '#8B1A1A' }} />} placeholder="votre@email.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mot de passe"
          rules={[
            { required: true, message: 'Le mot de passe est obligatoire.' },
            { min: 8, message: 'Minimum 8 caractères.' },
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#8B1A1A' }} />} placeholder="Minimum 8 caractères" />
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
          <Input.Password prefix={<LockOutlined style={{ color: '#8B1A1A' }} />} placeholder="Répétez votre mot de passe" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={isPending}
            block
            size="large"
            style={{ background: '#8B1A1A', borderColor: '#8B1A1A' }}
          >
            Créer mon compte
          </Button>
        </Form.Item>
      </Form>

      <Divider style={{ margin: '12px 0', borderColor: '#E8E8E8' }} />
      <Text style={{ display: 'block', textAlign: 'center' }}>
        Déjà un compte ?{' '}
        <Link to="/login" style={{ color: '#C9A84C', fontWeight: 600 }}>
          Se connecter
        </Link>
      </Text>
    </Card>
  );
}
