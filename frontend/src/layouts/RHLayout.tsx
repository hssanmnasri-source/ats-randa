import { useState } from 'react';
import { Layout, Menu, Avatar, Typography, Space, Button } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  AimOutlined,
  TrophyOutlined,
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
  { key: '/rh', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/rh/offers', icon: <FileTextOutlined />, label: 'Offres' },
  { key: '/rh/matching', icon: <AimOutlined />, label: 'Matching' },
  { key: '/rh/results', icon: <TrophyOutlined />, label: 'Résultats' },
];

export default function RHLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const selectedKey = menuItems.find((m) => location.pathname.startsWith(m.key) && m.key !== '/rh')?.key
    ?? (location.pathname === '/rh' ? '/rh' : '/rh');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ background: COLORS.dark }}
        trigger={null}
      >
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #2d2d4e' }}>
          <Typography.Title level={5} style={{ color: '#fff', margin: 0, fontSize: collapsed ? 12 : 16 }}>
            {collapsed ? 'ATS' : '🏢 ATS RANDA'}
          </Typography.Title>
          <Typography.Text style={{ color: '#aaa', fontSize: 11 }}>
            {!collapsed && 'Espace RH'}
          </Typography.Text>
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
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} style={{ background: COLORS.primary }} />
                <Typography.Text style={{ color: '#fff', fontSize: 12 }}>
                  {user?.prenom} {user?.nom}
                </Typography.Text>
              </Space>
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
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Typography.Text strong style={{ fontSize: 16 }}>
            {menuItems.find((m) => location.pathname.startsWith(m.key))?.label ?? 'Dashboard'}
          </Typography.Text>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: 8, minHeight: 400 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
