import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme';

const { Header } = Layout;

export default function AppHeader() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: 'Mon profil',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Se déconnecter',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        background: COLORS.dark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          🏢 ATS RANDA
        </Typography.Title>
      </Link>

      <Menu
        theme="dark"
        mode="horizontal"
        style={{ background: 'transparent', border: 'none', flex: 1, justifyContent: 'center' }}
        items={[
          { key: '/', label: <Link to="/">Offres</Link> },
        ]}
      />

      <Space>
        {isAuthenticated && user ? (
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: COLORS.primary }}
              />
              <Typography.Text style={{ color: '#fff' }}>
                {user.prenom} {user.nom}
              </Typography.Text>
            </Space>
          </Dropdown>
        ) : (
          <Space>
            <Button type="text" style={{ color: '#fff' }} onClick={() => navigate('/login')}>
              Connexion
            </Button>
            <Button type="primary" onClick={() => navigate('/register')}>
              S'inscrire
            </Button>
          </Space>
        )}
      </Space>
    </Header>
  );
}
