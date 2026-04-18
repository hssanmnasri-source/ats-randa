import React, { useState } from 'react'
import { Card, Select, Space, Typography, Button, List, Tag, Avatar, Empty, Spin, Pagination } from 'antd'
import {
  FileTextOutlined, ThunderboltOutlined,
  CheckCircleOutlined, CloseCircleOutlined, LoginOutlined,
  LogoutOutlined, EditOutlined, StopOutlined, PlusCircleOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons'
import { useAuditLogs } from '@/hooks/useAdmin'
import { COLORS } from '@/theme'
import type { AuditLog } from '@/types/admin'

const { Title, Text } = Typography

interface ActionMeta {
  icon: React.ReactNode
  color: string
  label: string
}

const ACTION_META: Record<string, ActionMeta> = {
  USER_LOGIN:          { icon: <LoginOutlined />,        color: '#1677ff', label: 'Connexion'       },
  USER_LOGOUT:         { icon: <LogoutOutlined />,       color: '#8B8B8B', label: 'Déconnexion'     },
  USER_CREATED:        { icon: <PlusCircleOutlined />,   color: '#52C41A', label: 'Création compte' },
  USER_UPDATED:        { icon: <EditOutlined />,         color: COLORS.gold, label: 'Modif. compte' },
  USER_TOGGLED:        { icon: <StopOutlined />,         color: '#FA8C16', label: 'Activation'      },
  OFFER_CREATED:       { icon: <PlusCircleOutlined />,   color: COLORS.primary, label: 'Nouvelle offre' },
  OFFER_ARCHIVED:      { icon: <StopOutlined />,         color: '#595959', label: 'Offre archivée'  },
  CV_UPLOADED:         { icon: <CloudUploadOutlined />,  color: COLORS.gold, label: 'CV uploadé'    },
  CV_INDEXED:          { icon: <FileTextOutlined />,     color: '#52C41A', label: 'CV indexé'       },
  CV_ERROR:            { icon: <CloseCircleOutlined />,  color: '#FF4D4F', label: 'Erreur CV'       },
  MATCHING_STARTED:    { icon: <ThunderboltOutlined />,  color: '#722ED1', label: 'Matching lancé'  },
  MATCHING_COMPLETED:  { icon: <ThunderboltOutlined />,  color: '#722ED1', label: 'Matching terminé'},
  DECISION_RETAINED:   { icon: <CheckCircleOutlined />,  color: '#52C41A', label: 'Retenu'          },
  DECISION_REFUSED:    { icon: <CloseCircleOutlined />,  color: '#FF4D4F', label: 'Refusé'          },
  DECISION_PENDING:    { icon: <ThunderboltOutlined />,  color: '#FA8C16', label: 'En attente'      },
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `il y a ${diff}s`
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`
  return new Date(iso).toLocaleDateString('fr-FR')
}

const AuditPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<string | undefined>()
  const { data, isLoading } = useAuditLogs({ page, action: actionFilter })

  const reset = () => {
    setActionFilter(undefined)
    setPage(1)
  }

  const logs: AuditLog[] = data?.items || []

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkBrown} 0%, ${COLORS.primary} 100%)`,
        borderRadius: 16, padding: '20px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <Title level={3} style={{ color: 'white', margin: 0 }}>Logs & Audit</Title>
          <div style={{ color: COLORS.goldLight, fontSize: 13, marginTop: 4 }}>
            Journal des actions importantes du système
          </div>
        </div>
        {data?.total != null && (
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 8,
            padding: '8px 16px', textAlign: 'center',
          }}>
            <div style={{ color: 'white', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{data.total}</div>
            <div style={{ color: COLORS.goldLight, fontSize: 11 }}>entrées</div>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Toutes les actions"
            allowClear
            value={actionFilter}
            style={{ width: 210 }}
            onChange={(v) => { setActionFilter(v); setPage(1) }}
            options={Object.entries(ACTION_META).map(([k, v]) => ({
              label: (
                <Space size={6}>
                  <span style={{ color: v.color }}>{v.icon}</span>
                  <span>{v.label}</span>
                </Space>
              ),
              value: k,
            }))}
          />
          <Button onClick={reset} disabled={!actionFilter}>
            Réinitialiser
          </Button>
        </Space>
      </Card>

      {/* Feed */}
      <Card style={{ borderRadius: 12, padding: 0 }} bodyStyle={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : logs.length === 0 ? (
          <Empty description="Aucun log trouvé" style={{ padding: 48 }} />
        ) : (
          <List
            dataSource={logs}
            split={false}
            renderItem={(log, idx) => {
              const meta = ACTION_META[log.action] || { icon: <FileTextOutlined />, color: '#8B8B8B', label: log.action }
              const isLast = idx === logs.length - 1
              return (
                <List.Item
                  key={log.id}
                  style={{
                    padding: '14px 24px',
                    borderBottom: isLast ? 'none' : '1px solid #f0f0f0',
                    alignItems: 'center',
                  }}
                >
                  {/* Icon */}
                  <Avatar
                    icon={meta.icon}
                    style={{ background: `${meta.color}18`, color: meta.color, flexShrink: 0, fontSize: 16 }}
                    size={40}
                  />

                  {/* Main content */}
                  <div style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Tag
                        style={{
                          background: `${meta.color}18`, color: meta.color,
                          border: `1px solid ${meta.color}40`,
                          fontWeight: 600, fontSize: 11, margin: 0,
                        }}
                      >
                        {meta.label}
                      </Tag>
                      <Text style={{ fontWeight: 500, fontSize: 13 }}>
                        {log.user_nom
                          ? <><span style={{ color: COLORS.primary }}>{log.user_nom}</span> <Text type="secondary" style={{ fontSize: 12 }}>({log.user_email})</Text></>
                          : <Text type="secondary">Système</Text>
                        }
                      </Text>
                      {log.resource && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          · {log.resource}{log.resource_id ? ` #${log.resource_id}` : ''}
                        </Text>
                      )}
                    </div>
                    <div style={{ marginTop: 4, display: 'flex', gap: 16 }}>
                      {log.ip_address && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          🌐 {log.ip_address}
                        </Text>
                      )}
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        🕐 {new Date(log.created_at).toLocaleString('fr-FR')}
                      </Text>
                    </div>
                  </div>

                  {/* Time ago badge */}
                  <div style={{
                    flexShrink: 0, marginLeft: 12,
                    background: '#f5f5f5', borderRadius: 6,
                    padding: '3px 8px', fontSize: 11, color: '#8B8B8B',
                    whiteSpace: 'nowrap',
                  }}>
                    {timeAgo(log.created_at)}
                  </div>
                </List.Item>
              )
            }}
          />
        )}

        {/* Pagination */}
        {!isLoading && data?.total > 50 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px', borderTop: '1px solid #f0f0f0' }}>
            <Pagination
              current={page}
              total={data?.total || 0}
              pageSize={50}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(t) => `${t} logs`}
              size="small"
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default AuditPage
