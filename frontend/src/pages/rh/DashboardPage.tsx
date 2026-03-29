import { Row, Col, Card, Button, Statistic, Alert, Spin, Typography, Space } from 'antd';
import {
  PlusOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  FileTextOutlined,
  SearchOutlined,
  TrophyOutlined,
  FireOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useRHStats } from '../../hooks/useRHDashboard';
import { useRHOffers } from '../../hooks/useOffers';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme';

const { Title, Text } = Typography;

const QUICK_ACTIONS = [
  {
    icon: <PlusOutlined style={{ fontSize: 28, color: COLORS.gold }} />,
    label: 'Publier une offre',
    path: '/rh/offers/new',
    bg: '#FFF8E6',
    border: COLORS.gold,
  },
  {
    icon: <FileTextOutlined style={{ fontSize: 28, color: COLORS.primary }} />,
    label: 'Gérer mes offres',
    path: '/rh/offers',
    bg: '#FFF0F0',
    border: COLORS.primary,
  },
  {
    icon: <TeamOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    label: 'Candidatures reçues',
    path: '/rh/candidatures',
    bg: '#E6F4FF',
    border: '#1677ff',
  },
  {
    icon: <ThunderboltOutlined style={{ fontSize: 28, color: '#722ED1' }} />,
    label: 'Matching IA',
    path: '/rh/matching',
    bg: '#F9F0FF',
    border: '#722ED1',
  },
  {
    icon: <SearchOutlined style={{ fontSize: 28, color: '#13C2C2' }} />,
    label: 'CVthèque',
    path: '/rh/cvtheque',
    bg: '#E6FFFB',
    border: '#13C2C2',
  },
  {
    icon: <TrophyOutlined style={{ fontSize: 28, color: '#52C41A' }} />,
    label: 'Résultats & Décisions',
    path: '/rh/results',
    bg: '#F0FFF4',
    border: '#52C41A',
  },
];

const KPI_CARDS = (stats: ReturnType<typeof useRHStats>['data']) => [
  {
    title: 'Offres actives',
    value: stats?.mes_offres.actives ?? 0,
    color: COLORS.primary,
    bg: '#FFF0F0',
    icon: <FileTextOutlined />,
    suffix: 'offres',
    path: '/rh/offers',
  },
  {
    title: 'Total candidatures',
    value: stats?.candidatures.total ?? 0,
    color: '#1677ff',
    bg: '#E6F4FF',
    icon: <TeamOutlined />,
    suffix: 'dossiers',
    path: '/rh/candidatures',
  },
  {
    title: 'Retenus',
    value: stats?.candidatures.retained ?? 0,
    color: '#52C41A',
    bg: '#F0FFF4',
    icon: <CheckCircleOutlined />,
    suffix: 'candidats',
    path: '/rh/results',
  },
  {
    title: 'En attente',
    value: stats?.candidatures.pending ?? 0,
    color: COLORS.gold,
    bg: '#FFF8E6',
    icon: <ClockCircleOutlined />,
    suffix: 'pending',
    path: '/rh/candidatures',
  },
  {
    title: 'CVs indexés (IA)',
    value: stats?.cvtheque.avec_embedding ?? 0,
    color: '#722ED1',
    bg: '#F9F0FF',
    icon: <DatabaseOutlined />,
    suffix: 'CVs',
    path: '/rh/cvtheque',
  },
];

export default function RHDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useRHStats();
  const { data: offersData } = useRHOffers({ limit: 5 });

  const pieData = stats
    ? [
        { name: 'En attente', value: stats.candidatures.pending, color: COLORS.gold },
        { name: 'Retenus',    value: stats.candidatures.retained, color: '#52C41A' },
        { name: 'Refusés',   value: stats.candidatures.refused, color: COLORS.primary },
      ].filter((d) => d.value > 0)
    : [];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkBrown} 0%, ${COLORS.primary} 65%, ${COLORS.gold} 100%)`,
        borderRadius: 16,
        padding: '28px 36px',
        marginBottom: 24,
        color: 'white',
      }}>
        <Row align="middle" justify="space-between" wrap>
          <Col>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              Bonjour, {user?.prenom || user?.nom || 'Recruteur'} !
            </Title>
            <Text style={{ color: COLORS.goldLight, fontSize: 15 }}>
              Votre espace recruteur — ATS RANDA
            </Text>
          </Col>
          {(stats?.candidatures.nouvelles_24h ?? 0) > 0 && (
            <Col>
              <Alert
                type="warning"
                icon={<FireOutlined />}
                message={
                  `${stats!.candidatures.nouvelles_24h} nouvelle${stats!.candidatures.nouvelles_24h > 1 ? 's' : ''} candidature${stats!.candidatures.nouvelles_24h > 1 ? 's' : ''} aujourd'hui`
                }
                showIcon
                style={{
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: COLORS.gold,
                  border: 'none',
                  color: COLORS.darkBrown,
                }}
                onClick={() => navigate('/rh/candidatures')}
              />
            </Col>
          )}
        </Row>
      </div>

      {/* Actions rapides */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {QUICK_ACTIONS.map((action) => (
          <Col xs={12} sm={8} md={4} key={action.path}>
            <Card
              hoverable
              onClick={() => navigate(action.path)}
              style={{
                textAlign: 'center',
                borderRadius: 12,
                border: `2px solid ${action.border}30`,
                background: action.bg,
                cursor: 'pointer',
              }}
              styles={{ body: { padding: '18px 10px' } }}
            >
              <div style={{ marginBottom: 8 }}>{action.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.3 }}>
                {action.label}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* KPI Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {KPI_CARDS(stats).map((kpi) => (
          <Col xs={12} sm={8} md={24 / 5 as 4} key={kpi.title} style={{ flex: '0 0 20%', maxWidth: '20%' }}>
            <Card
              hoverable
              onClick={() => navigate(kpi.path)}
              style={{
                borderRadius: 12,
                borderLeft: `4px solid ${kpi.color}`,
                cursor: 'pointer',
              }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: kpi.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                fontSize: 16,
                color: kpi.color,
              }}>
                {kpi.icon}
              </div>
              <Statistic
                title={<span style={{ fontSize: 12, color: '#595959' }}>{kpi.title}</span>}
                value={kpi.value}
                suffix={<span style={{ fontSize: 11, color: '#8B8B8B' }}>{kpi.suffix}</span>}
                valueStyle={{ fontSize: 26, fontWeight: 800, color: kpi.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Bas : offres récentes + répartition candidatures */}
      <Row gutter={24}>
        {/* Mes dernières offres */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <AimOutlined style={{ color: COLORS.primary }} />
                <span style={{ color: COLORS.primary, fontWeight: 700 }}>Mes dernières offres</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/rh/offers')} style={{ color: COLORS.gold }}>
                Voir tout →
              </Button>
            }
            style={{ borderRadius: 12 }}
          >
            {(offersData?.offers ?? []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#8B8B8B' }}>
                <FileTextOutlined style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
                Aucune offre publiée
                <div style={{ marginTop: 12 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/rh/offers/new')}
                    style={{ background: COLORS.primary, borderColor: COLORS.primary }}
                  >
                    Publier une offre
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {(offersData?.offers ?? []).map((offer) => (
                  <div
                    key={offer.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: `1px solid ${COLORS.grayBorder}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        strong
                        style={{
                          color: COLORS.textDark,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {offer.titre}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textMedium }}>
                        {offer.date_publication ? new Date(offer.date_publication).toLocaleDateString('fr-FR') : '—'}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Button
                        size="small"
                        icon={<ThunderboltOutlined />}
                        style={{ color: '#722ED1', borderColor: '#722ED1' }}
                        onClick={() => navigate('/rh/matching')}
                      >
                        Matcher
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Répartition candidatures */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: COLORS.primary }} />
                <span style={{ color: COLORS.primary, fontWeight: 700 }}>Répartition candidatures</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val} candidats`]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#8B8B8B' }}>
                <CloseCircleOutlined style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
                Aucune candidature encore
                <div style={{ marginTop: 12 }}>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={() => navigate('/rh/matching')}
                    style={{ background: '#722ED1', borderColor: '#722ED1' }}
                  >
                    Lancer le matching
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
