import { useState } from 'react';
import { Layout, Menu, Avatar, Typography, Space, Button } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UserAddOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../theme';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/admin/users', icon: <TeamOutlined />, label: 'Utilisateurs' },
  { key: '/admin/users/new', icon: <UserAddOutlined />, label: 'Créer utilisateur' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const selectedKey = menuItems.find((m) => location.pathname === m.key)?.key ?? '/admin';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsed={collapsed} style={{ background: COLORS.dark }} trigger={null}>
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #2d2d4e' }}>
          <Typography.Title level={5} style={{ color: '#fff', margin: 0, fontSize: collapsed ? 12 : 16 }}>
            {collapsed ? 'ATS' : '🏢 ATS RANDA'}
          </Typography.Title>
          {!collapsed && <Typography.Text style={{ color: '#aaa', fontSize: 11 }}>Administration</Typography.Text>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ background: COLORS.dark, borderRight: 'none' }}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
        <div style={{ position: 'absolute', bottom: 24, width: '100%', padding: '0 16px' }}>
          {!collapsed && (
            <Space>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: COLORS.primary }} />
              <Typography.Text style={{ color: '#fff', fontSize: 12 }}>
                {user?.prenom} {user?.nom}
              </Typography.Text>
            </Space>
          )}
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: '#aaa', width: '100%', marginTop: 8 }}
            size="small"
          >
            {!collapsed && 'Déconnexion'}
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f0f0f0' }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Typography.Text strong style={{ fontSize: 16 }}>
            {menuItems.find((m) => location.pathname === m.key)?.label ?? 'Administration'}
          </Typography.Text>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
