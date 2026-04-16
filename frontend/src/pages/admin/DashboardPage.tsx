import React from 'react'
import {
  Row, Col, Card, Alert, Button,
  Table, Tag, Space, Spin
} from 'antd'
import { msg as message } from '@/services/messageService';
import {
  DatabaseOutlined, TeamOutlined, FileTextOutlined,
  ThunderboltOutlined, WarningOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SyncOutlined, UserAddOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useAdminStats, useSystemHealth, useReindex } from '@/hooks/useAdmin'
import { COLORS } from '@/theme'

const ServiceBadge: React.FC<{ name: string; status: string }> = ({ name, status }) => {
  const isHealthy = status === 'healthy' || status.startsWith('v')
  return (
    <Card
      style={{
        borderRadius: 10,
        border: `2px solid ${isHealthy ? '#52C41A' : '#FF4D4F'}20`,
        background: isHealthy ? '#F0FFF4' : '#FFF1F0',
        textAlign: 'center',
      }}
      styles={{ body: { padding: '12px 8px' } }}
    >
      <div style={{ fontSize: 20, marginBottom: 4 }}>
        {isHealthy
          ? <CheckCircleOutlined style={{ color: '#52C41A' }} />
          : <CloseCircleOutlined style={{ color: '#FF4D4F' }} />
        }
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A1A' }}>{name}</div>
      <div style={{ fontSize: 11, color: isHealthy ? '#52C41A' : '#FF4D4F' }}>
        {isHealthy ? 'Operationnel' : 'Erreur'}
      </div>
    </Card>
  )
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: health, isLoading: healthLoading } = useSystemHealth()
  const reindexMutation = useReindex()

  const handleReindex = async () => {
    try {
      await reindexMutation.mutateAsync()
      message.success('Re-indexation lancee ! Les CVs seront traites en arriere-plan.')
    } catch {
      message.error('Erreur lors du lancement de la re-indexation.')
    }
  }

  const sourceData = stats ? [
    { name: 'Keejob', value: stats.cvs.par_source['KEEJOB'] || 0, color: '#1677ff' },
    { name: 'Agent', value: stats.cvs.par_source['AGENT'] || 0, color: COLORS.gold },
    { name: 'Candidat', value: stats.cvs.par_source['CANDIDAT'] || 0, color: '#52C41A' },
  ] : []

  const roleData = stats ? Object.entries(stats.users.par_role).map(([role, count]) => ({
    name: role,
    value: count as number,
    color: role === 'ADMIN' ? COLORS.darkBrown : role === 'RH' ? COLORS.primary :
           role === 'AGENT' ? COLORS.gold : role === 'CANDIDATE' ? '#1677ff' : '#8B8B8B',
  })) : []

  const decisionData = stats?.matching ? [
    { name: 'En attente', value: stats.matching.par_decision?.['PENDING'] || 0, color: COLORS.gold },
    { name: 'Retenus', value: stats.matching.par_decision?.['RETAINED'] || 0, color: '#52C41A' },
    { name: 'Refuses', value: stats.matching.par_decision?.['REFUSED'] || 0, color: COLORS.primary },
  ] : []

  if (statsLoading || healthLoading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  return (
    <div>
      {/* Hero Admin */}
      <div style={{
        background: `linear-gradient(135deg, #1A0A00 0%, ${COLORS.darkBrown} 40%, ${COLORS.primary} 80%, ${COLORS.gold} 100%)`,
        borderRadius: 16, padding: '28px 36px', marginBottom: 24,
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <div style={{ color: COLORS.gold, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              ADMINISTRATION SYSTEME
            </div>
            <div style={{ color: 'white', fontSize: 26, fontWeight: 800 }}>
              Dashboard Admin — ATS RANDA
            </div>
            <div style={{ color: COLORS.goldLight, fontSize: 14, marginTop: 4 }}>
              Vision globale et controle total du systeme
            </div>
          </Col>
        </Row>
      </div>

      {/* Alerte si CVs en erreur */}
      {(stats?.cvs.erreurs || 0) > 0 && (
        <Alert
          type="warning"
          icon={<WarningOutlined />}
          message={`${stats?.cvs.erreurs} CV(s) en erreur d'indexation`}
          description="Des CVs n'ont pas pu etre indexes. Lancez une re-indexation."
          action={
            <Button size="small" onClick={handleReindex} loading={reindexMutation.isPending}>
              Re-indexer
            </Button>
          }
          showIcon
          style={{ marginBottom: 16, borderRadius: 10 }}
        />
      )}

      {/* Statut services */}
      {health && (
        <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <div style={{ fontWeight: 700, color: COLORS.primary, marginBottom: 8 }}>
              Statut des services
            </div>
          </Col>
          {Object.entries(health.services).map(([name, status]) => (
            <Col xs={12} sm={6} key={name}>
              <ServiceBadge
                name={name.charAt(0).toUpperCase() + name.slice(1)}
                status={status}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          {
            title: 'Utilisateurs totaux',
            value: stats?.users.total || 0,
            sub: `${stats?.users.actifs || 0} actifs`,
            color: COLORS.primary, bg: '#FFF0F0',
            icon: <TeamOutlined />,
            path: '/admin/users',
          },
          {
            title: 'CVs dans le systeme',
            value: stats?.cvs.total || 0,
            sub: `${stats?.cvs.indexes || 0} indexes`,
            color: '#1677ff', bg: '#E6F4FF',
            icon: <DatabaseOutlined />,
            path: '/admin/cvs',
          },
          {
            title: "Offres d'emploi",
            value: stats?.offres.total || 0,
            sub: `${stats?.offres.actives || 0} actives`,
            color: COLORS.gold, bg: '#FFF8E6',
            icon: <FileTextOutlined />,
            path: '/admin/offers',
          },
          {
            title: 'Candidats enregistres',
            value: stats?.candidats.total || 0,
            sub: `${stats?.users.nouveaux_7j || 0} nouveaux (7j)`,
            color: '#52C41A', bg: '#F0FFF4',
            icon: <TeamOutlined />,
            path: '/admin/users',
          },
          {
            title: 'Score moyen matching',
            value: `${Math.round((stats?.matching?.score_moyen || 0) * 100)}%`,
            sub: `${stats?.matching?.total_resultats || 0} resultats`,
            color: '#722ED1', bg: '#F9F0FF',
            icon: <ThunderboltOutlined />,
            path: '/admin/audit',
          },
          {
            title: 'CVs en erreur',
            value: stats?.cvs.erreurs || 0,
            sub: health?.metrics.cvs_pending_embedding
              ? `${health.metrics.cvs_pending_embedding} en attente`
              : '0 en attente',
            color: (stats?.cvs.erreurs || 0) > 0 ? '#FF4D4F' : '#52C41A',
            bg: (stats?.cvs.erreurs || 0) > 0 ? '#FFF1F0' : '#F0FFF4',
            icon: <WarningOutlined />,
            path: '/admin/cvs',
          },
        ].map((kpi) => (
          <Col xs={12} sm={8} md={4} key={kpi.title}>
            <Card
              hoverable
              onClick={() => navigate(kpi.path)}
              style={{
                borderRadius: 12,
                borderLeft: `4px solid ${kpi.color}`,
                cursor: 'pointer',
              }}
              styles={{ body: { padding: '16px' } }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: kpi.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 10, fontSize: 16, color: kpi.color,
              }}>
                {kpi.icon}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, color: '#595959', marginTop: 2 }}>
                {kpi.title}
              </div>
              <div style={{ fontSize: 10, color: '#8B8B8B' }}>{kpi.sub}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Graphiques */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>CVs par source</span>}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sourceData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartTooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {sourceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>Utilisateurs par role</span>}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%" cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {roleData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>Decisions matching</span>}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={decisionData}
                  cx="50%" cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {decisionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartTooltip formatter={(val) => [`${val} resultats`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Top RH + Actions rapides */}
      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>Top RH par activite</span>}
            style={{ borderRadius: 12 }}
          >
            <Table
              dataSource={stats?.top_rh || []}
              rowKey="email"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Recruteur',
                  render: (_: unknown, r: { prenom: string; nom: string }) => (
                    <Space>
                      <span style={{ fontWeight: 600 }}>{r.prenom} {r.nom}</span>
                    </Space>
                  ),
                },
                {
                  title: 'Email',
                  dataIndex: 'email',
                  render: (v: string) =>
                    <span style={{ fontSize: 12, color: '#595959' }}>{v}</span>,
                },
                {
                  title: 'Offres',
                  dataIndex: 'nb_offres',
                  render: (v: number) => (
                    <Tag color={COLORS.primary} style={{ fontWeight: 700 }}>
                      {v} offre{v > 1 ? 's' : ''}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>Actions rapides</span>}
            style={{ borderRadius: 12 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Button
                block
                icon={<UserAddOutlined />}
                onClick={() => navigate('/admin/users/new')}
                style={{
                  background: COLORS.primary, color: 'white',
                  border: 'none', borderRadius: 8, fontWeight: 600,
                  height: 42,
                }}
              >
                Creer un utilisateur
              </Button>
              <Button
                block
                icon={<SyncOutlined />}
                onClick={handleReindex}
                loading={reindexMutation.isPending}
                style={{
                  background: COLORS.gold, color: COLORS.darkBrown,
                  border: 'none', borderRadius: 8, fontWeight: 600,
                  height: 42,
                }}
              >
                Re-indexer les CVs ({health?.metrics.cvs_pending_embedding || 0} en attente)
              </Button>
              <Button
                block
                icon={<HistoryOutlined />}
                onClick={() => navigate('/admin/audit')}
                style={{ borderColor: COLORS.primary, color: COLORS.primary, borderRadius: 8, height: 42 }}
              >
                Voir les logs d'audit
              </Button>
              <Button
                block
                icon={<DatabaseOutlined />}
                onClick={() => navigate('/admin/system/health')}
                style={{ borderRadius: 8, height: 42 }}
              >
                Sante systeme detaillee
              </Button>
            </Space>

            {health && (
              <div style={{
                marginTop: 16, padding: 12,
                background: '#F5F5F5', borderRadius: 8,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#595959', marginBottom: 8 }}>
                  Metriques systeme
                </div>
                {[
                  { label: 'Taille BD', value: health.metrics.db_size },
                  { label: 'Redis RAM', value: health.metrics.redis_memory },
                  { label: 'Workers Celery', value: `${health.metrics.celery_workers} actif(s)` },
                ].map((m) => (
                  <Row key={m.label} justify="space-between" style={{ marginBottom: 4 }}>
                    <Col style={{ fontSize: 12, color: '#595959' }}>{m.label}</Col>
                    <Col style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>{m.value}</Col>
                  </Row>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboardPage
