import { useState } from 'react';
import { Layout, Menu, Typography, Button, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  HistoryOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Sider, Header, Content } = Layout;

const SIDEBAR_BG = '#3D0C02';
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#F0D080';

const items: MenuProps['items'] = [
  {
    key: '/admin/dashboard',
    icon: <DashboardOutlined />,
    label: 'Tableau de bord',
  },
  {
    key: 'users-group',
    icon: <TeamOutlined />,
    label: 'Utilisateurs',
    children: [
      { key: '/admin/users', label: 'Tous les utilisateurs' },
      { key: '/admin/users/new', label: 'Creer un utilisateur' },
    ],
  },
  {
    key: 'system-group',
    icon: <SettingOutlined />,
    label: 'Systeme',
    children: [
      { key: '/admin/system/health', label: 'Sante systeme' },
    ],
  },
  {
    key: '/admin/audit',
    icon: <HistoryOutlined />,
    label: 'Logs & Audit',
  },
  {
    key: 'data-group',
    icon: <DatabaseOutlined />,
    label: 'Donnees',
    children: [
      { key: '/admin/cvs', label: 'CVs' },
    ],
  },
];

// Helper to find current page label
function findLabel(path: string): string {
  const flatItems: { key: string; label: string }[] = [
    { key: '/admin/dashboard', label: 'Tableau de bord' },
    { key: '/admin/users', label: 'Tous les utilisateurs' },
    { key: '/admin/users/new', label: 'Creer un utilisateur' },
    { key: '/admin/system/health', label: 'Sante systeme' },
    { key: '/admin/audit', label: 'Logs & Audit' },
    { key: '/admin/cvs', label: 'Gestion des CVs' },
  ];
  return flatItems.find((i) => i.key === path)?.label ?? 'Administration';
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  // Compute selected key based on current path
  const currentPath = location.pathname;
  const selectedKey = currentPath === '/admin' ? '/admin/dashboard' : currentPath;

  // Compute open keys for groups
  const openKeys: string[] = [];
  if (currentPath.startsWith('/admin/users')) openKeys.push('users-group');
  if (currentPath.startsWith('/admin/system')) openKeys.push('system-group');
  if (currentPath.startsWith('/admin/cvs') || currentPath.startsWith('/admin/offers')) openKeys.push('data-group');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsed={collapsed} style={{ background: SIDEBAR_BG }} trigger={null}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '12px 8px' : '16px',
          textAlign: 'center',
          borderBottom: `1px solid #5C1010`,
          background: SIDEBAR_BG,
        }}>
          {!collapsed && (
            <Typography.Text style={{ display: 'block', color: GOLD_LIGHT, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Espace Administrateur
            </Typography.Text>
          )}
          <img
            src="/logo-randa.transparent.png"
            style={{
              height: collapsed ? 32 : 60,
              objectFit: 'contain',
              maxWidth: '100%',
              transition: 'height 0.2s',
              display: 'block',
              margin: '0 auto',
            }}
            alt="ATS RANDA"
          />
        </div>

        {/* Admin badge */}
        {!collapsed && (
          <div style={{
            textAlign: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #5C1010',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <img src="/icon/admin-icon.png" width={52} alt="Admin" style={{ objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            <div style={{ color: GOLD_LIGHT, fontSize: 12, marginTop: 4, fontWeight: 600 }}>
              {user?.prenom} {user?.nom}
            </div>
            <div style={{ color: GOLD, fontSize: 11 }}>Administrateur</div>
          </div>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          style={{ background: SIDEBAR_BG, borderRight: 'none', marginTop: 8 }}
          items={items}
          onClick={({ key }) => navigate(key)}
        />

        <div style={{ position: 'absolute', bottom: 24, width: '100%', padding: '0 16px' }}>
          {collapsed && (
            <Space style={{ marginBottom: 8, justifyContent: 'center', width: '100%' }}>
              <img src="/icon/admin-icon.png" width={24} height={24} style={{ objectFit: 'contain', borderRadius: '50%' }} alt="Admin" />
            </Space>
          )}
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: GOLD, width: '100%', textAlign: collapsed ? 'center' : 'left' }}
            size="small"
          >
            {!collapsed && 'Deconnexion'}
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
            {findLabel(currentPath)}
          </Typography.Text>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: 12 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
