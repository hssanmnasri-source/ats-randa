import { useState } from 'react';
import { Layout, Menu, Typography, Button, Space, Badge, Divider } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  AimOutlined,
  TrophyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusCircleOutlined,
  DatabaseOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRHStats } from '../hooks/useRHDashboard';
import { COLORS } from '../theme';

const { Sider, Header, Content } = Layout;

const SIDEBAR_BG = COLORS.darkBrown;
const GOLD = COLORS.gold;
const GOLD_LIGHT = COLORS.goldLight;

const menuItems = [
  { key: '/rh',            icon: <DashboardOutlined />,   label: 'Tableau de bord' },
  { key: '/rh/offers',     icon: <FileTextOutlined />,    label: 'Mes offres' },
  { key: '/rh/offers/new', icon: <PlusCircleOutlined />,  label: 'Publier une offre' },
  { key: '/rh/matching',   icon: <AimOutlined />,         label: 'Matching IA' },
  { key: '/rh/results',    icon: <TrophyOutlined />,       label: 'Résultats & Décisions' },
  { key: '/rh/cvtheque',   icon: <DatabaseOutlined />,    label: 'CVthèque' },
  { key: '/rh/candidatures', icon: <TeamOutlined />,      label: 'Candidatures reçues' },
];

function SidebarWidget({ collapsed }: { collapsed: boolean }) {
  const { data: stats } = useRHStats();
  if (collapsed || !stats) return null;

  return (
    <div style={{ padding: '12px 16px', borderTop: `1px solid #5C1010` }}>
      {/* Annonces */}
      <div style={{ marginBottom: 10 }}>
        <Typography.Text style={{ color: GOLD, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>
          VOS ANNONCES
        </Typography.Text>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text style={{ color: GOLD_LIGHT, fontSize: 11 }}>
            Actives
          </Typography.Text>
          <Typography.Text style={{ color: '#52C41A', fontSize: 12, fontWeight: 700 }}>
            {stats.mes_offres.actives}
          </Typography.Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text style={{ color: GOLD_LIGHT, fontSize: 11 }}>
            Archivées
          </Typography.Text>
          <Typography.Text style={{ color: '#8B8B8B', fontSize: 12 }}>
            {stats.mes_offres.archivees}
          </Typography.Text>
        </div>
      </div>

      <Divider style={{ borderColor: '#5C1010', margin: '8px 0' }} />

      {/* Candidatures */}
      <div style={{ marginBottom: 10 }}>
        <Typography.Text style={{ color: GOLD, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>
          CANDIDATURES
        </Typography.Text>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text style={{ color: GOLD_LIGHT, fontSize: 11 }}>En attente</Typography.Text>
          <Badge count={stats.candidatures.pending} color={COLORS.primary} size="small" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text style={{ color: GOLD_LIGHT, fontSize: 11 }}>Retenus</Typography.Text>
          <Typography.Text style={{ color: '#52C41A', fontSize: 12, fontWeight: 700 }}>
            {stats.candidatures.retained}
          </Typography.Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text style={{ color: GOLD_LIGHT, fontSize: 11 }}>Refusés</Typography.Text>
          <Typography.Text style={{ color: '#8B8B8B', fontSize: 12 }}>
            {stats.candidatures.refused}
          </Typography.Text>
        </div>
      </div>

      <Divider style={{ borderColor: '#5C1010', margin: '8px 0' }} />

      {/* CVthèque */}
      <div>
        <Typography.Text style={{ color: GOLD, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>
          CVTHÈQUE
        </Typography.Text>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text style={{ color: GOLD_LIGHT, fontSize: 11 }}>CVs indexés</Typography.Text>
          <Typography.Text style={{ color: '#722ED1', fontSize: 12, fontWeight: 700 }}>
            {stats.cvtheque.avec_embedding.toLocaleString()}
          </Typography.Text>
        </div>
      </div>
    </div>
  );
}

export default function RHLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const selectedKey =
    menuItems
      .filter((m) => m.key !== '/rh')
      .find((m) => location.pathname.startsWith(m.key))?.key
    ?? '/rh';

  const pageLabel = menuItems.find((m) => location.pathname.startsWith(m.key))?.label ?? 'Tableau de bord';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ background: SIDEBAR_BG, display: 'flex', flexDirection: 'column' }}
        trigger={null}
        width={220}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <div style={{
            padding: collapsed ? '12px 8px' : '16px',
            textAlign: 'center',
            borderBottom: `1px solid #5C1010`,
            background: SIDEBAR_BG,
            flexShrink: 0,
          }}>
            {!collapsed && (
              <Typography.Text style={{ display: 'block', color: GOLD_LIGHT, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Espace RH
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

          {/* Role badge */}
          {!collapsed && (
            <div style={{
              textAlign: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #5C1010',
              background: 'rgba(0,0,0,0.2)',
              flexShrink: 0,
            }}>
              <img src="/icon/rh-icon.png" width={52} alt="RH" style={{ objectFit: 'contain', display: 'block', margin: '0 auto' }} />
              <div style={{ color: GOLD_LIGHT, fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                {user?.prenom} {user?.nom}
              </div>
              <div style={{ color: GOLD, fontSize: 11 }}>Recruteur RH</div>
            </div>
          )}

          {/* Menu */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[selectedKey]}
              style={{ background: SIDEBAR_BG, borderRight: 'none', marginTop: 8 }}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
            />
          </div>

          {/* Widget stats */}
          <SidebarWidget collapsed={collapsed} />

          {/* User + logout */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid #5C1010`, flexShrink: 0 }}>
            {!collapsed && (
              <Space style={{ marginBottom: 8 }}>
                <img src="/icon/rh-icon.png" width={28} height={28} style={{ objectFit: 'contain' }} alt="RH" />
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
            style={{ color: COLORS.primary }}
          />
          <Typography.Text strong style={{ fontSize: 16, color: '#1A1A1A' }}>
            {pageLabel}
          </Typography.Text>
        </Header>
        <Content style={{
          margin: '24px',
          background: '#fff',
          padding: '24px',
          borderRadius: 12,
          minHeight: 400,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
