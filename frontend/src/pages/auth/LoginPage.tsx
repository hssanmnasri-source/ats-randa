import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Divider, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import type { LoginRequest } from '../../types/auth';

const { Title, Text } = Typography;

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
    <Card
      style={{
        width: 420,
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        border: '1px solid #C9A84C',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img
          src="/logo-randa.png"
          style={{ width: 180, marginBottom: 16, objectFit: 'contain' }}
          alt="ATS RANDA"
        />
        <Title level={4} style={{ color: '#8B1A1A', margin: 0 }}>
          Bienvenue sur ATS RANDA
        </Title>
        <Text style={{ color: '#C9A84C', fontSize: 13 }}>
          Applicant Tracking System
        </Text>
      </div>

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
            prefix={<MailOutlined style={{ color: '#8B1A1A' }} />}
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
            prefix={<LockOutlined style={{ color: '#8B1A1A' }} />}
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
            style={{ background: '#8B1A1A', borderColor: '#8B1A1A' }}
          >
            Se connecter
          </Button>
        </Form.Item>
      </Form>

      <Divider style={{ margin: '12px 0', borderColor: '#E8E8E8' }} />
      <Text style={{ display: 'block', textAlign: 'center' }}>
        Pas encore de compte ?{' '}
        <Link to="/register" style={{ color: '#C9A84C', fontWeight: 600 }}>
          S'inscrire
        </Link>
      </Text>
    </Card>
  );
}
