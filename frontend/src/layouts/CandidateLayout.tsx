import { useState } from 'react';
import { Layout, Menu, Typography, Button, Space, Avatar, Progress, Tooltip } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  AppstoreOutlined,
  MailOutlined,
  FolderOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProfileCompletion } from '../hooks/useCandidate';

const { Sider, Header, Content } = Layout;

const SIDEBAR_BG = '#3D0C02';
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#F0D080';

const menuItems = [
  { key: '/candidate',              icon: <HomeOutlined />,       label: 'Mon Espace'              },
  { key: '/candidate/profile',      icon: <UserOutlined />,       label: 'Mon Profil CV'           },
  { key: '/candidate/applications', icon: <AppstoreOutlined />,   label: 'Mes Candidatures'        },
  { key: '/candidate/favorites',     icon: <HeartOutlined />,      label: 'Offres favorites'        },
  { key: '/candidate/cover-letters',icon: <MailOutlined />,       label: 'Lettres de motivation'   },
  { key: '/candidate/documents',    icon: <FolderOutlined />,     label: 'Mes Documents'           },
  { key: '/candidate/settings',     icon: <SettingOutlined />,    label: 'Paramètres'              },
];

function completionColor(pct: number) {
  if (pct >= 80) return '#52C41A';
  if (pct >= 50) return GOLD;
  return '#FF4D4F';
}

export default function CandidateLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: completion } = useProfileCompletion();

  const handleLogout = () => { logout(); navigate('/login'); };

  // Highlight the deepest matching menu key
  const selectedKey =
    menuItems
      .slice()
      .reverse()
      .find((m) => location.pathname.startsWith(m.key) && (m.key !== '/candidate' || location.pathname === '/candidate'))
      ?.key ?? '/candidate';

  const pct = completion?.total ?? 0;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsed={collapsed}
        width={230}
        style={{ background: SIDEBAR_BG, position: 'relative' }}
        trigger={null}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '12px 8px' : '16px',
          textAlign: 'center',
          borderBottom: '1px solid #5C1010',
          background: SIDEBAR_BG,
        }}>
          <img
            src="/logo-randa.transparent.png"
            style={{
              height: collapsed ? 32 : 56,
              objectFit: 'contain',
              maxWidth: '100%',
              transition: 'height 0.2s',
              display: 'block',
              margin: '0 auto',
            }}
            alt="ATS RANDA"
          />
          {!collapsed && (
            <Typography.Text style={{ display: 'block', color: GOLD_LIGHT, fontSize: 11, marginTop: 4 }}>
              Espace Candidat
            </Typography.Text>
          )}
        </div>

        {/* Profile completion widget */}
        {!collapsed && (
          <div style={{
            margin: '12px 12px 4px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Typography.Text style={{ color: GOLD_LIGHT, fontSize: 11 }}>
                Profil complété
              </Typography.Text>
              <Typography.Text style={{ color: completionColor(pct), fontSize: 11, fontWeight: 600 }}>
                {pct}%
              </Typography.Text>
            </div>
            <Progress
              percent={pct}
              showInfo={false}
              size="small"
              strokeColor={completionColor(pct)}
              trailColor="rgba(255,255,255,0.15)"
            />
          </div>
        )}

        {collapsed && pct > 0 && (
          <Tooltip title={`Profil complété à ${pct}%`} placement="right">
            <div style={{ padding: '8px 16px' }}>
              <Progress
                type="circle"
                percent={pct}
                size={32}
                strokeColor={completionColor(pct)}
                format={() => ''}
                trailColor="rgba(255,255,255,0.15)"
              />
            </div>
          </Tooltip>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ background: SIDEBAR_BG, borderRight: 'none', marginTop: 4 }}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />

        {/* User info + logout */}
        <div style={{ position: 'absolute', bottom: 24, width: '100%', padding: '0 12px' }}>
          {!collapsed && (
            <Space style={{ marginBottom: 8, width: '100%' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: '#8B1A1A', flexShrink: 0 }} />
              <Typography.Text
                style={{ color: GOLD_LIGHT, fontSize: 12 }}
                ellipsis
              >
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
            {menuItems.find((m) => location.pathname.startsWith(m.key) && (m.key !== '/candidate' || location.pathname === '/candidate'))?.label ?? 'Espace Candidat'}
          </Typography.Text>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: 12 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
