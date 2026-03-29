import React from 'react'
import { Card, Row, Col, Badge, Button, Statistic, Spin, message, Popconfirm, Typography } from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, DatabaseOutlined, ThunderboltOutlined
} from '@ant-design/icons'
import { useSystemHealth, useReindex } from '@/hooks/useAdmin'
import { COLORS } from '@/theme'

const { Title } = Typography

const ServiceCard: React.FC<{ name: string; status: string }> = ({ name, status }) => {
  const isHealthy = status === 'healthy' || status.startsWith('v')
  return (
    <Card
      style={{
        borderRadius: 12,
        border: `2px solid ${isHealthy ? '#52C41A' : '#FF4D4F'}40`,
        background: isHealthy ? '#F6FFED' : '#FFF1F0',
        textAlign: 'center',
      }}
      styles={{ body: { padding: 24 } }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>
        {isHealthy
          ? <CheckCircleOutlined style={{ color: '#52C41A' }} />
          : <CloseCircleOutlined style={{ color: '#FF4D4F' }} />
        }
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{name}</div>
      <Badge
        status={isHealthy ? 'success' : 'error'}
        text={<span style={{ fontSize: 13 }}>{status}</span>}
      />
    </Card>
  )
}

const SystemHealthPage: React.FC = () => {
  const { data: health, isLoading, refetch } = useSystemHealth()
  const reindexMutation = useReindex()

  const handleReindex = async () => {
    try {
      await reindexMutation.mutateAsync()
      message.success('Re-indexation lancee !')
    } catch {
      message.error('Erreur lors du lancement.')
    }
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  const serviceNames: Record<string, string> = {
    postgresql: 'PostgreSQL',
    pgvector: 'pgvector',
    redis: 'Redis',
    celery: 'Celery',
  }

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkBrown} 0%, ${COLORS.primary} 100%)`,
        borderRadius: 16, padding: '20px 28px', marginBottom: 24,
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ color: 'white', margin: 0 }}>Sante du systeme</Title>
            <div style={{ color: COLORS.goldLight, fontSize: 13, marginTop: 4 }}>
              Mise a jour automatique toutes les 30 secondes
            </div>
          </Col>
          <Col>
            <Button
              icon={<SyncOutlined />}
              onClick={() => refetch()}
              style={{ borderColor: COLORS.gold, color: COLORS.gold }}
            >
              Actualiser
            </Button>
          </Col>
        </Row>
      </div>

      {/* Services */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {health && Object.entries(health.services).map(([key, status]) => (
          <Col xs={24} sm={12} md={6} key={key}>
            <ServiceCard name={serviceNames[key] || key} status={status} />
          </Col>
        ))}
      </Row>

      {/* Metriques */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Taille de la base de donnees', value: health?.metrics.db_size || '?', icon: <DatabaseOutlined /> },
          { title: 'Memoire Redis utilisee', value: health?.metrics.redis_memory || '?', icon: <DatabaseOutlined /> },
          { title: 'Workers Celery actifs', value: health?.metrics.celery_workers ?? 0, icon: <ThunderboltOutlined /> },
          { title: "CVs en attente d'indexation", value: health?.metrics.cvs_pending_embedding ?? 0, icon: <SyncOutlined /> },
        ].map((m) => (
          <Col xs={24} sm={12} md={6} key={m.title}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
              <Statistic
                title={m.title}
                value={m.value}
                prefix={m.icon}
                valueStyle={{ color: COLORS.primary, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Action re-indexation */}
      <Card
        title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>Re-indexation IA</span>}
        style={{ borderRadius: 12 }}
      >
        <p style={{ color: '#595959', marginBottom: 16 }}>
          Lance la tache de re-indexation pour tous les CVs sans embedding.
          {health?.metrics.cvs_pending_embedding
            ? ` ${health.metrics.cvs_pending_embedding} CV(s) en attente.`
            : ' Tous les CVs sont indexes.'}
        </p>
        <Popconfirm
          title="Lancer la re-indexation ?"
          description="Cette operation peut prendre plusieurs minutes selon le nombre de CVs."
          onConfirm={handleReindex}
          okText="Lancer"
          cancelText="Annuler"
        >
          <Button
            type="primary"
            icon={<SyncOutlined />}
            loading={reindexMutation.isPending}
            style={{ background: COLORS.primary, borderColor: COLORS.primary }}
          >
            Re-indexer les CVs
          </Button>
        </Popconfirm>
      </Card>
    </div>
  )
}

export default SystemHealthPage
