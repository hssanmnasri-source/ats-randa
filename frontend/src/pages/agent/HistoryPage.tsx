import { useState } from 'react'
import { Card, Table, Tag, Space, Typography, Empty, Select, Row, Col } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'
import { useAgentHistory } from '../../hooks/useAgent'
import type { HistoryEntry } from '../../types/agent'
import { COLORS } from '../../theme'
import PageHeader from '../../components/common/PageHeader'
import dayjs from 'dayjs'

const DECISION_COLOR: Record<string, string> = {
  RETAINED: 'success', REFUSED: 'error', PENDING: 'processing'
}
const DECISION_LABEL: Record<string, string> = {
  RETAINED: 'Retenu ✓', REFUSED: 'Refusé', PENDING: 'En attente'
}
const STATUT_COLOR: Record<string, string> = {
  INDEXED: 'success', UPLOADED: 'processing', PARSING: 'warning', ERROR: 'error'
}

export default function HistoryPage() {
  const [page, setPage] = useState(1)
  const [filterDecision, setFilterDecision] = useState<string | null>(null)
  const { data, isLoading } = useAgentHistory(page)

  const history: HistoryEntry[] = data?.history ?? []
  const total = data?.total ?? 0

  const filtered = filterDecision
    ? history.filter((h) => {
        if (filterDecision === 'RETAINED') return h.decisions.retained > 0
        if (filterDecision === 'REFUSED') return h.decisions.refused > 0
        if (filterDecision === 'PENDING') return h.nb_offres_matchees === 0 || h.decisions.pending > 0
        return true
      })
    : history

  const columns = [
    {
      title: 'Date',
      key: 'date',
      width: 120,
      render: (_: any, r: HistoryEntry) =>
        r.date ? dayjs(r.date).format('DD/MM/YY HH:mm') : '—',
    },
    {
      title: 'Candidat',
      key: 'candidat',
      render: (_: any, r: HistoryEntry) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.candidat_prenom} {r.candidat_nom}</div>
          {r.candidat_email && (
            <div style={{ fontSize: 12, color: '#595959' }}>{r.candidat_email}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Statut CV',
      key: 'statut',
      width: 110,
      render: (_: any, r: HistoryEntry) => (
        <Tag color={STATUT_COLOR[r.cv_statut] ?? 'default'}>{r.cv_statut}</Tag>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      width: 90,
      render: (_: any, r: HistoryEntry) =>
        r.meilleur_score != null
          ? <Tag color="blue">{Math.round(r.meilleur_score * 100)}%</Tag>
          : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: 'Offres matchées',
      key: 'offres',
      width: 130,
      render: (_: any, r: HistoryEntry) => (
        <Space>
          {r.decisions.retained > 0 && <Tag color="success">{r.decisions.retained} retenu</Tag>}
          {r.decisions.refused > 0 && <Tag color="error">{r.decisions.refused} refusé</Tag>}
          {r.decisions.pending > 0 && <Tag color="processing">{r.decisions.pending} en attente</Tag>}
          {r.nb_offres_matchees === 0 && <Tag color="default">0 offre</Tag>}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Historique d'activité"
        subtitle={`${total} CV${total > 1 ? 's' : ''} uploadé${total > 1 ? 's' : ''}`}
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col>
            <Typography.Text strong>Filtrer par décision :</Typography.Text>
          </Col>
          <Col>
            <Select
              style={{ width: 180 }}
              placeholder="Toutes les décisions"
              allowClear
              onChange={(val) => { setFilterDecision(val ?? null); setPage(1) }}
              options={[
                { value: 'RETAINED', label: 'Retenus ✓' },
                { value: 'REFUSED', label: 'Refusés' },
                { value: 'PENDING', label: 'En attente' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Table
        rowKey="cv_id"
        columns={columns}
        dataSource={filtered}
        loading={isLoading}
        expandable={{
          expandedRowRender: (r: HistoryEntry) => (
            r.offres.length === 0 ? (
              <Empty description="Aucun matching effectué" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ padding: '8px 0' }}>
                {r.offres.map((o, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '6px 0', borderBottom: '1px solid #f0f0f0',
                  }}>
                    <TrophyOutlined style={{ color: COLORS.gold }} />
                    <span style={{ flex: 1 }}>{o.offre_titre}</span>
                    <Tag color={DECISION_COLOR[o.decision] ?? 'default'}>
                      {DECISION_LABEL[o.decision] ?? o.decision}
                    </Tag>
                    <Tag color="blue">{Math.round((o.score || 0) * 100)}%</Tag>
                  </div>
                ))}
              </div>
            )
          ),
          rowExpandable: () => true,
        }}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: setPage,
          showTotal: (t) => `${t} CVs`,
        }}
        size="middle"
      />
    </div>
  )
}
