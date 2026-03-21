import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Divider, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import type { LoginRequest } from '../../types/auth';

export default function LoginPage() {
  const { mutate: login, isPending, isError } = useLogin();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const map: Record<string, string> = {
        ADMIN: '/admin',
        RH: '/rh',
        AGENT: '/agent',
        CANDIDATE: '/candidate',
        VISITOR: '/',
      };
      navigate(map[user.role] ?? '/');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <Card style={{ width: '100%', maxWidth: 420 }}>
      <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
        Connexion
      </Typography.Title>

      {isError && (
        <Alert
          message="Email ou mot de passe incorrect."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form<LoginRequest>
        layout="vertical"
        onFinish={(values) => login(values)}
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="Adresse email"
          rules={[
            { required: true, message: "L'email est obligatoire." },
            { type: 'email', message: "Format d'email invalide." },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="votre@email.com"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mot de passe"
          rules={[{ required: true, message: 'Le mot de passe est obligatoire.' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Votre mot de passe"
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={isPending}
            block
            size="large"
          >
            Se connecter
          </Button>
        </Form.Item>
      </Form>

      <Divider style={{ margin: '12px 0' }} />
      <Typography.Text style={{ display: 'block', textAlign: 'center' }}>
        Pas encore de compte ?{' '}
        <Link to="/register">S'inscrire</Link>
      </Typography.Text>
    </Card>
  );
}
