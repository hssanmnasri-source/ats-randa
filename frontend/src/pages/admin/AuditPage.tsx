import React, { useState } from 'react'
import { Card, Table, Tag, Select, Space, Typography, Button } from 'antd'
import {
  UserOutlined, FileTextOutlined, ThunderboltOutlined,
  CheckCircleOutlined, CloseCircleOutlined, LoginOutlined
} from '@ant-design/icons'
import { useAuditLogs } from '@/hooks/useAdmin'
import { COLORS } from '@/theme'
import type { AuditLog } from '@/types/admin'

const { Title } = Typography

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: '#1677ff',
  USER_LOGOUT: '#8B8B8B',
  USER_CREATED: '#52C41A',
  USER_UPDATED: COLORS.gold,
  USER_TOGGLED: '#FA8C16',
  OFFER_CREATED: COLORS.primary,
  OFFER_ARCHIVED: '#595959',
  CV_UPLOADED: COLORS.gold,
  CV_INDEXED: '#52C41A',
  CV_ERROR: '#FF4D4F',
  MATCHING_STARTED: '#722ED1',
  MATCHING_COMPLETED: '#722ED1',
  DECISION_RETAINED: '#52C41A',
  DECISION_REFUSED: '#FF4D4F',
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  USER_LOGIN: <LoginOutlined />,
  USER_CREATED: <UserOutlined />,
  CV_UPLOADED: <FileTextOutlined />,
  CV_INDEXED: <FileTextOutlined />,
  MATCHING_STARTED: <ThunderboltOutlined />,
  MATCHING_COMPLETED: <ThunderboltOutlined />,
  DECISION_RETAINED: <CheckCircleOutlined />,
  DECISION_REFUSED: <CloseCircleOutlined />,
}

const AuditPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<string | undefined>()

  const { data, isLoading } = useAuditLogs({ page, action: actionFilter })

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      render: (action: string) => (
        <Tag
          icon={ACTION_ICONS[action]}
          color={ACTION_COLORS[action] || '#8B8B8B'}
          style={{ fontWeight: 600 }}
        >
          {action}
        </Tag>
      ),
    },
    {
      title: 'Utilisateur',
      render: (_: unknown, r: AuditLog) => r.user_nom
        ? <span>{r.user_nom} <span style={{ color: '#8B8B8B', fontSize: 12 }}>({r.user_email})</span></span>
        : <span style={{ color: '#8B8B8B' }}>Systeme</span>,
    },
    {
      title: 'Ressource',
      dataIndex: 'resource',
      render: (v: string | null, r: AuditLog) =>
        v ? <span>{v}{r.resource_id ? ` #${r.resource_id}` : ''}</span> : '-',
    },
    {
      title: 'IP',
      dataIndex: 'ip_address',
      render: (v: string | null) => v || '-',
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      render: (v: string) => new Date(v).toLocaleString('fr-FR'),
      defaultSortOrder: 'descend' as const,
    },
  ]

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkBrown} 0%, ${COLORS.primary} 100%)`,
        borderRadius: 16, padding: '20px 28px', marginBottom: 24,
      }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>Logs & Audit</Title>
        <div style={{ color: COLORS.goldLight, fontSize: 13, marginTop: 4 }}>
          Journal des actions importantes du systeme
        </div>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Filtrer par action"
            allowClear
            style={{ width: 200 }}
            onChange={(v) => { setActionFilter(v); setPage(1) }}
            options={Object.keys(ACTION_COLORS).map((a) => ({ label: a, value: a }))}
          />
          <Button onClick={() => { setActionFilter(undefined); setPage(1) }}>
            Reinitialiser
          </Button>
        </Space>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={data?.items || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            total: data?.total || 0,
            pageSize: 50,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (t) => `${t} logs`,
          }}
          size="small"
        />
      </Card>
    </div>
  )
}

export default AuditPage
