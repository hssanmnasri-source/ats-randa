import { useState } from 'react'
import { Row, Col, Typography, Table, Tag, Button, Drawer, Space, Spin, Empty } from 'antd'
import {
  FileTextOutlined, CheckCircleOutlined, SyncOutlined,
  ExclamationCircleOutlined, UploadOutlined, InboxOutlined,
  HistoryOutlined, UserOutlined, TrophyOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import StatsCard from '../../components/dashboard/StatsCard'
import { useAgentDashboard, useCandidateResults } from '../../hooks/useAgent'
import { COLORS } from '../../theme'
import type { AgentCandidat } from '../../types/agent'
import dayjs from 'dayjs'

function CandidateResultsDrawer({ cvId }: { cvId: number }) {
  const { data, isLoading } = useCandidateResults(cvId)
  if (isLoading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
  if (!data) return null

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong>
          {data.candidat.prenom} {data.candidat.nom}
        </Typography.Text>
        {data.candidat.email && (
          <div style={{ color: '#595959', fontSize: 13 }}>{data.candidat.email}</div>
        )}
        <Tag style={{ marginTop: 4 }}>{data.cv_statut}</Tag>
      </div>

      {data.resultats.length === 0 ? (
        <Empty description="Aucun matching effectué" />
      ) : (
        data.resultats.map((r: any) => (
          <div key={r.id} style={{
            border: `1px solid #f0f0f0`, borderRadius: 8,
            padding: '12px 16px', marginBottom: 12,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.offre_titre}</div>
            <Space wrap>
              <Tag color={r.decision === 'RETAINED' ? 'success' : r.decision === 'REFUSED' ? 'error' : 'processing'}>
                {r.decision === 'RETAINED' ? 'Retenu ✓' : r.decision === 'REFUSED' ? 'Refusé' : 'En attente'}
              </Tag>
              <Tag color="blue">Score : {Math.round((r.score_final || 0) * 100)}%</Tag>
            </Space>
          </div>
        ))
      )}
    </div>
  )
}

export default function AgentDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useAgentDashboard()
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null)

  const stats = data?.stats
  const candidats = data?.candidats_recents ?? []

  const columns = [
    {
      title: 'Candidat',
      key: 'nom',
      render: (_: any, r: AgentCandidat) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.prenom} {r.nom}</div>
          {r.email && <div style={{ fontSize: 12, color: '#595959' }}>{r.email}</div>}
        </div>
      ),
    },
    {
      title: 'Statut CV',
      key: 'cv_statut',
      width: 120,
      render: (_: any, r: AgentCandidat) => {
        const colorMap: Record<string, string> = {
          INDEXED: 'success', UPLOADED: 'processing', ERROR: 'error', PARSING: 'warning'
        }
        return <Tag color={colorMap[r.cv_statut] ?? 'default'}>{r.cv_statut}</Tag>
      },
    },
    {
      title: 'Score',
      key: 'score',
      width: 90,
      render: (_: any, r: AgentCandidat) =>
        r.meilleur_score != null
          ? <Tag color="blue">{Math.round(r.meilleur_score * 100)}%</Tag>
          : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: 'Décision',
      key: 'decision',
      width: 120,
      render: (_: any, r: AgentCandidat) => {
        if (!r.meilleure_decision) return <Tag color="default">—</Tag>
        const colorMap: Record<string, string> = { RETAINED: 'success', REFUSED: 'error', PENDING: 'processing' }
        const labelMap: Record<string, string> = { RETAINED: 'Retenu ✓', REFUSED: 'Refusé', PENDING: 'En attente' }
        return <Tag color={colorMap[r.meilleure_decision]}>{labelMap[r.meilleure_decision] ?? r.meilleure_decision}</Tag>
      },
    },
    {
      title: 'Upload',
      key: 'date',
      width: 110,
      render: (_: any, r: AgentCandidat) =>
        r.date_upload ? dayjs(r.date_upload).format('DD/MM/YY') : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, r: AgentCandidat) => (
        <Button
          size="small"
          icon={<TrophyOutlined />}
          style={{ color: COLORS.primary, borderColor: COLORS.primary }}
          onClick={() => setSelectedCvId(r.cv_id)}
        >
          Résultats
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24, color: COLORS.primary }}>
        Tableau de bord Agent
      </Typography.Title>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard title="Total CVs" value={stats?.total_cvs ?? 0}
            icon={<FileTextOutlined />} color={COLORS.primary} loading={isLoading} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard title="Indexés" value={stats?.indexes ?? 0}
            icon={<CheckCircleOutlined />} color={COLORS.secondary} loading={isLoading} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard title="En attente" value={stats?.en_attente ?? 0}
            icon={<SyncOutlined />} color={COLORS.warning} loading={isLoading} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard title="Retenus" value={stats?.retenus ?? 0}
            icon={<CheckCircleOutlined />} color="#52C41A" loading={isLoading} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard title="Refusés" value={stats?.refuses ?? 0}
            icon={<ExclamationCircleOutlined />} color={COLORS.danger} loading={isLoading} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatsCard title="En examen" value={stats?.pending ?? 0}
            icon={<UserOutlined />} color={COLORS.warning} loading={isLoading} />
        </Col>
      </Row>

      {/* Actions rapides */}
      <Space style={{ marginBottom: 24 }} wrap>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          style={{ background: COLORS.primary, borderColor: COLORS.primary }}
          onClick={() => navigate('/agent/upload')}
        >
          Uploader un CV
        </Button>
        <Button
          icon={<InboxOutlined />}
          style={{ borderColor: COLORS.gold, color: COLORS.gold }}
          onClick={() => navigate('/agent/batch')}
        >
          Scan en masse
        </Button>
        <Button
          icon={<HistoryOutlined />}
          onClick={() => navigate('/agent/history')}
        >
          Historique
        </Button>
      </Space>

      {/* Candidats récents */}
      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        Mes candidats récents
      </Typography.Title>
      <Table
        rowKey="cv_id"
        columns={columns}
        dataSource={candidats}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        size="middle"
      />

      <Drawer
        title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>🏆 Résultats du candidat</span>}
        open={!!selectedCvId}
        onClose={() => setSelectedCvId(null)}
        width={500}
        destroyOnClose
      >
        {selectedCvId && <CandidateResultsDrawer cvId={selectedCvId} />}
      </Drawer>
    </div>
  )
}
