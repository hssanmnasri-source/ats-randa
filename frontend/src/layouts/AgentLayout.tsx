import { useState } from 'react';
import { Layout, Menu, Typography, Button, Space, Avatar } from 'antd';
import {
  DashboardOutlined,
  UploadOutlined,
  UnorderedListOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Sider, Header, Content } = Layout;

const SIDEBAR_BG = '#3D0C02';
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#F0D080';

const menuItems = [
  { key: '/agent', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/agent/upload', icon: <UploadOutlined />, label: 'Upload CV' },
  { key: '/agent/cvs', icon: <UnorderedListOutlined />, label: 'Liste CVs' },
];

export default function AgentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const selectedKey = menuItems.find((m) => location.pathname === m.key)?.key ?? '/agent';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsed={collapsed} style={{ background: SIDEBAR_BG }} trigger={null}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '12px 8px' : '16px',
          textAlign: 'center',
          borderBottom: '1px solid #5C1010',
          background: SIDEBAR_BG,
        }}>
          <img
            src="/logo-randa.png"
            style={{
              height: collapsed ? 32 : 60,
              objectFit: 'contain',
              maxWidth: '100%',
              transition: 'height 0.2s',
            }}
            alt="ATS RANDA"
          />
          {!collapsed && (
            <Typography.Text style={{ display: 'block', color: GOLD_LIGHT, fontSize: 11, marginTop: 4 }}>
              Espace Agent
            </Typography.Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ background: SIDEBAR_BG, borderRight: 'none', marginTop: 8 }}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />

        <div style={{ position: 'absolute', bottom: 24, width: '100%', padding: '0 16px' }}>
          {!collapsed && (
            <Space style={{ marginBottom: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: '#8B1A1A' }} />
              <Typography.Text style={{ color: GOLD_LIGHT, fontSize: 12 }}>
                {user?.prenom} {user?.nom}
              </Typography.Text>
            </Space>
          )}
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: GOLD, width: '100%', textAlign: collapsed ? 'center' : 'left' }}
            size="small"
          >
            {!collapsed && 'Déconnexion'}
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header style={{
          background: '#FFFFFF',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `2px solid ${GOLD}`,
          boxShadow: '0 2px 8px rgba(139,26,26,0.1)',
          height: 64,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#8B1A1A' }}
          />
          <Typography.Text strong style={{ fontSize: 16, color: '#1A1A1A' }}>
            {menuItems.find((m) => location.pathname === m.key)?.label ?? 'Espace Agent'}
          </Typography.Text>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: 12 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
