import React, { useState } from 'react'
import { Card, Table, Tag, Select, Space, Typography, Row, Col, Statistic, Button, message } from 'antd'
import { DatabaseOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { useAdminStats, useReindex } from '@/hooks/useAdmin'
import { COLORS } from '@/theme'

const { Title } = Typography

const STATUS_COLORS: Record<string, string> = {
  UPLOADED: '#1677ff',
  PARSING: COLORS.gold,
  INDEXED: '#52C41A',
  ERROR: '#FF4D4F',
}

const AdminCVsPage: React.FC = () => {
  const { data: stats } = useAdminStats()
  const reindexMutation = useReindex()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [sourceFilter, setSourceFilter] = useState<string | undefined>()
  const [page, setPage] = useState(1)

  const { data: cvsData, isLoading } = useQuery({
    queryKey: ['admin', 'cvs', { page, status: statusFilter, source: sourceFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.append('statut', statusFilter)
      if (sourceFilter) params.append('source', sourceFilter)
      const res = await api.get(`/api/admin/cvs?${params}`)
      return res.data
    },
    staleTime: 30_000,
  })

  const handleReindex = async () => {
    try {
      await reindexMutation.mutateAsync()
      message.success('Re-indexation lancee !')
    } catch {
      message.error('Erreur lors du lancement.')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: 'Fichier / Candidat',
      render: (_: unknown, r: { nom_fichier?: string; id_candidat?: number }) =>
        r.nom_fichier || `Candidat #${r.id_candidat || '-'}`,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      render: (v: string) => (
        <Tag color={v === 'KEEJOB' ? '#1677ff' : v === 'AGENT' ? COLORS.gold : '#52C41A'}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v] || '#8B8B8B'}>{v}</Tag>
      ),
    },
    {
      title: 'Embedding',
      dataIndex: 'has_embedding',
      render: (v: boolean) => v
        ? <CheckCircleOutlined style={{ color: '#52C41A' }} />
        : <CloseCircleOutlined style={{ color: '#FF4D4F' }} />,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString('fr-FR'),
    },
  ]

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkBrown} 0%, ${COLORS.primary} 100%)`,
        borderRadius: 16, padding: '20px 28px', marginBottom: 24,
      }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>Gestion des CVs</Title>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total CVs', value: stats?.cvs.total || 0, color: '#1677ff' },
          { title: 'Indexes', value: stats?.cvs.indexes || 0, color: '#52C41A' },
          { title: 'En erreur', value: stats?.cvs.erreurs || 0, color: '#FF4D4F' },
          { title: 'Keejob', value: stats?.cvs.par_source?.['KEEJOB'] || 0, color: COLORS.gold },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.title}>
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
              <Statistic
                title={s.title}
                value={s.value}
                valueStyle={{ color: s.color, fontWeight: 700 }}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filtres */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Filtrer par statut"
            allowClear
            style={{ width: 180 }}
            onChange={(v) => { setStatusFilter(v); setPage(1) }}
            options={['UPLOADED', 'PARSING', 'INDEXED', 'ERROR'].map((s) => ({ label: s, value: s }))}
          />
          <Select
            placeholder="Filtrer par source"
            allowClear
            style={{ width: 180 }}
            onChange={(v) => { setSourceFilter(v); setPage(1) }}
            options={['KEEJOB', 'AGENT', 'CANDIDAT'].map((s) => ({ label: s, value: s }))}
          />
          <Button
            icon={<SyncOutlined />}
            onClick={handleReindex}
            loading={reindexMutation.isPending}
            style={{ background: COLORS.gold, color: COLORS.darkBrown, border: 'none', fontWeight: 600 }}
          >
            Re-indexer les erreurs
          </Button>
        </Space>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={cvsData?.items || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            total: cvsData?.total || 0,
            pageSize: 20,
            onChange: setPage,
            showTotal: (t) => `${t} CVs`,
          }}
          size="small"
        />
      </Card>
    </div>
  )
}

export default AdminCVsPage
