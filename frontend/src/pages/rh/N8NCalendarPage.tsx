import React, { useState } from 'react'
import {
  Card, Row, Col, Button, Table, Tag, Select,
  DatePicker, Space, Alert, Modal,
  Statistic, Badge, Drawer, Input, Popconfirm,
} from 'antd'
import { msg as message } from '@/services/messageService';
import {
  ThunderboltOutlined, CheckCircleOutlined,
  MailOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { COLORS } from '@/theme'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(localizedFormat)
dayjs.locale('fr')

// ── Types ──────────────────────────────────────────────────
interface Entretien {
  id: number
  candidat_nom: string
  candidat_prenom: string
  candidat_email: string
  candidat_telephone: string
  offre_titre: string
  date_entretien: string
  duree_minutes: number
  type_entretien: string
  lieu: string
  lien_visio: string | null
  statut: string
}

interface OffreEntretiens {
  offre_id: number
  offre_titre: string
  entretiens: Entretien[]
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  presentiel:   { label: '🏢 Présentiel',      color: COLORS.primary },
  visio:        { label: '💻 Visioconférence',  color: '#1677ff' },
  telephonique: { label: '📞 Téléphonique',     color: '#52C41A' },
}

// ── Page principale ────────────────────────────────────────
const N8NCalendarPage: React.FC = () => {
  const qc = useQueryClient()
  const [typeGlobal, setTypeGlobal] = useState<string>('presentiel')
  const [editingEntretien, setEditingEntretien] = useState<Entretien | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [generating, setGenerating] = useState(false)

  const { data: proposeData, isLoading: loadingPropose, refetch } = useQuery({
    queryKey: ['n8n', 'propose'],
    queryFn: async () => (await api.get('/api/n8n/entretiens/propose')).data,
    refetchInterval: 5000,
  })

  const { data: calendarData } = useQuery({
    queryKey: ['n8n', 'calendrier'],
    queryFn: async () => (await api.get('/api/n8n/calendrier')).data,
    refetchInterval: 10000,
  })

  // ── Déclencher n8n via le backend (évite CORS) ─────────
  const handleGenerer = async () => {
    setGenerating(true)
    try {
      const res = await api.post('/api/n8n/declencher-generation')
      const data = res.data
      message.success(`🎉 ${data.total || 0} créneaux générés ! Vérifiez et confirmez ci-dessous.`)
      await refetch()
      qc.invalidateQueries({ queryKey: ['n8n'] })
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "n8n n'est pas disponible — vérifiez que le workflow est activé"
      message.error(`Erreur : ${msg}`)
    } finally {
      setGenerating(false)
    }
  }

  // ── Supprimer un entretien ────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/rh/calendar/${id}`),
    onSuccess: () => {
      message.success('Rendez-vous supprimé')
      qc.invalidateQueries({ queryKey: ['n8n'] })
    },
    onError: () => message.error('Erreur lors de la suppression'),
  })

  // ── Modifier un entretien ──────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Entretien> & { id: number }) =>
      api.put(`/api/n8n/entretiens/${data.id}`, data),
    onSuccess: () => {
      message.success('Entretien mis à jour')
      qc.invalidateQueries({ queryKey: ['n8n'] })
      setEditingEntretien(null)
    },
  })

  // ── Confirmer tous ────────────────────────────────────
  const confirmerMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/n8n/entretiens/confirmer-tout?type_global=${typeGlobal}`).then(r => r.data),
    onSuccess: async (data) => {
      message.success(`✅ ${data.nb_emails} entretiens confirmés !`)
      setShowConfirmModal(false)

      // Envoi des emails via le mailer du backend (pas de SMTP à configurer dans n8n)
      try {
        const emailRes = await api.post('/api/n8n/envoyer-emails-backend', {
          confirmed: data.confirmed,
        })
        const { nb_sent, nb_total } = emailRes.data
        if (nb_sent === 0) {
          message.warning(`⚠️ Aucun email envoyé (${nb_total} entretiens confirmés) — vérifiez MAIL_ENABLED dans .env`)
        } else if (nb_sent < nb_total) {
          message.warning(`📧 ${nb_sent}/${nb_total} emails envoyés — vérifiez les logs pour les échecs`)
        } else {
          message.success(`📧 ${nb_sent}/${nb_total} emails envoyés avec succès !`)
        }
      } catch {
        message.warning('⚠️ Entretiens confirmés — vérifiez MAIL_ENABLED dans .env pour les emails')
      }

      qc.invalidateQueries({ queryKey: ['n8n'] })
    },
  })

  const offres: OffreEntretiens[] = proposeData?.offres || []
  const totalPropose: number = proposeData?.total || 0
  const statsCalendrier = calendarData?.stats || {}

  return (
    <div>
      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkBrown}, ${COLORS.primary})`,
        borderRadius: 16, padding: '24px 32px', marginBottom: 24,
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>
              🤖 Calendrier Automatique — n8n
            </div>
            <div style={{ color: COLORS.goldLight, marginTop: 4 }}>
              Génération automatique des entretiens pour tous les candidats retenus
            </div>
          </Col>
          <Col>
            <Button
              size="large"
              loading={generating}
              icon={<ThunderboltOutlined />}
              onClick={handleGenerer}
              style={{
                background: COLORS.gold, border: 'none',
                color: COLORS.darkBrown, fontWeight: 800,
                borderRadius: 10, height: 48, fontSize: 15,
              }}
            >
              {generating ? 'n8n en cours...' : '🚀 Générer les entretiens'}
            </Button>
          </Col>
        </Row>
      </div>

      {/* ── Stats ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { label: '📋 Proposés',      value: statsCalendrier.PROPOSE  || 0, color: COLORS.gold },
          { label: '✅ Confirmés',     value: statsCalendrier.CONFIRME || 0, color: '#52C41A' },
          { label: '📧 Emails envoyés', value: statsCalendrier.ENVOYE  || 0, color: '#1677ff' },
          { label: '📅 Planifiés',     value: statsCalendrier.PLANIFIE || 0, color: '#8B8B8B' },
        ].map(s => (
          <Col xs={12} md={6} key={s.label}>
            <Card
              style={{ borderRadius: 12, borderTop: `3px solid ${s.color}`, textAlign: 'center' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={<span style={{ fontSize: 12 }}>{s.label}</span>}
                value={s.value}
                styles={{ content: { color: s.color, fontWeight: 800, fontSize: 28 } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Entretiens PROPOSE ── */}
      {totalPropose > 0 && (
        <Card
          style={{ borderRadius: 16, marginBottom: 20, border: `2px solid ${COLORS.gold}` }}
          title={
            <Row justify="space-between" align="middle">
              <Col>
                <Badge count={totalPropose} style={{ background: COLORS.primary }}>
                  <span style={{ color: COLORS.primary, fontWeight: 700, fontSize: 16, marginRight: 8 }}>
                    📋 Créneaux générés — En attente de confirmation
                  </span>
                </Badge>
              </Col>
              <Col>
                <Space>
                  <Select
                    value={typeGlobal}
                    onChange={setTypeGlobal}
                    style={{ width: 200 }}
                    options={[
                      { value: 'presentiel', label: '🏢 Tous en présentiel' },
                      { value: 'visio',      label: '💻 Tous en visio' },
                    ]}
                  />
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    size="large"
                    onClick={() => setShowConfirmModal(true)}
                    style={{ background: '#52C41A', border: 'none', fontWeight: 700, borderRadius: 10 }}
                  >
                    ✅ Confirmer et envoyer les emails
                  </Button>
                </Space>
              </Col>
            </Row>
          }
        >
          <Alert
            type="info" showIcon
            message="Vérifiez les créneaux ci-dessous. Vous pouvez modifier la date, le type et le lieu avant de confirmer."
            style={{ marginBottom: 16, borderRadius: 8 }}
          />

          {offres.map(offre => (
            <Card
              key={offre.offre_id}
              type="inner"
              title={
                <span style={{ color: COLORS.primary, fontWeight: 700 }}>
                  💼 {offre.offre_titre}
                  <Tag style={{ marginLeft: 8 }} color={COLORS.gold}>
                    {offre.entretiens.length} entretien{offre.entretiens.length > 1 ? 's' : ''}
                  </Tag>
                </span>
              }
              style={{ marginBottom: 12, borderRadius: 10 }}
            >
              <Table
                dataSource={offre.entretiens}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Candidat',
                    render: (_: unknown, r: Entretien) => (
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.candidat_prenom} {r.candidat_nom}</div>
                        <div style={{ fontSize: 11, color: '#8B8B8B' }}>{r.candidat_email}</div>
                      </div>
                    ),
                  },
                  {
                    title: 'Date & Heure',
                    render: (_: unknown, r: Entretien) => (
                      <div style={{ fontWeight: 600, color: COLORS.primary }}>
                        {r.date_entretien ? dayjs(r.date_entretien).format('ddd DD MMM YYYY à HH:mm') : '—'}
                      </div>
                    ),
                  },
                  {
                    title: 'Type',
                    render: (_: unknown, r: Entretien) => {
                      const cfg = TYPE_CONFIG[r.type_entretien] || TYPE_CONFIG.presentiel
                      return <Tag color={cfg.color} style={{ fontWeight: 600, borderRadius: 20 }}>{cfg.label}</Tag>
                    },
                  },
                  {
                    title: 'Durée',
                    render: (_: unknown, r: Entretien) => `${r.duree_minutes} min`,
                  },
                  {
                    title: '',
                    render: (_: unknown, r: Entretien) => (
                      <Space>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => setEditingEntretien(r)}
                          style={{ color: COLORS.primary }}
                        >
                          Modifier
                        </Button>
                        <Popconfirm
                          title="Supprimer ce rendez-vous ?"
                          description="Cette action est irréversible."
                          okText="Supprimer"
                          cancelText="Annuler"
                          okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
                          onConfirm={() => deleteMutation.mutate(r.id)}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                          >
                            Supprimer
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          ))}
        </Card>
      )}

      {/* ── État vide ── */}
      {totalPropose === 0 && !loadingPropose && (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
          <ThunderboltOutlined style={{ fontSize: 48, color: '#D9D9D9' }} />
          <div style={{ marginTop: 16, color: '#8B8B8B', fontSize: 16 }}>
            Cliquez sur "🚀 Générer les entretiens" pour planifier automatiquement tous les candidats retenus
          </div>
        </Card>
      )}

      {/* ── Modal confirmation ── */}
      <Modal
        title="✅ Confirmer et envoyer les emails"
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        footer={null}
        width={500}
      >
        <Alert
          type="warning" showIcon
          message={`${totalPropose} email${totalPropose > 1 ? 's' : ''} vont être envoyés aux candidats`}
          description="Cette action est irréversible. Les candidats recevront leurs invitations par email."
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Type d'entretien pour tous :</div>
          <Select
            value={typeGlobal}
            onChange={setTypeGlobal}
            style={{ width: '100%' }}
            size="large"
            options={[
              { value: 'presentiel', label: '🏢 Présentiel — RANDA Ben Arous' },
              { value: 'visio',      label: '💻 Visioconférence — Lien à définir' },
            ]}
          />
        </div>
        <Row gutter={12}>
          <Col span={12}>
            <Button block onClick={() => setShowConfirmModal(false)} size="large">Annuler</Button>
          </Col>
          <Col span={12}>
            <Button
              block type="primary" size="large"
              loading={confirmerMutation.isPending}
              icon={<MailOutlined />}
              onClick={() => confirmerMutation.mutate()}
              style={{ background: '#52C41A', border: 'none', fontWeight: 700 }}
            >
              Confirmer et envoyer
            </Button>
          </Col>
        </Row>
      </Modal>

      {/* ── Drawer modifier entretien ── */}
      <Drawer
        title="✏️ Modifier l'entretien"
        open={!!editingEntretien}
        onClose={() => setEditingEntretien(null)}
        size="default"
        style={{ maxWidth: 420 }}
        footer={
          <Button
            type="primary" block
            loading={updateMutation.isPending}
            onClick={() => editingEntretien && updateMutation.mutate(editingEntretien)}
            style={{ background: COLORS.primary, border: 'none' }}
          >
            Sauvegarder
          </Button>
        }
      >
        {editingEntretien && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>👤 Candidat</div>
              <div style={{ color: '#595959' }}>
                {editingEntretien.candidat_prenom} {editingEntretien.candidat_nom}
                <br /><small>{editingEntretien.candidat_email}</small>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>📅 Date et heure</div>
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="DD/MM/YYYY HH:mm"
                value={editingEntretien.date_entretien ? dayjs(editingEntretien.date_entretien) : null}
                onChange={date => setEditingEntretien({
                  ...editingEntretien,
                  date_entretien: date?.toISOString() || '',
                })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>🎥 Type</div>
              <Select
                value={editingEntretien.type_entretien}
                onChange={v => setEditingEntretien({ ...editingEntretien, type_entretien: v })}
                style={{ width: '100%' }}
                options={[
                  { value: 'presentiel',   label: '🏢 Présentiel' },
                  { value: 'visio',        label: '💻 Visioconférence' },
                  { value: 'telephonique', label: '📞 Téléphonique' },
                ]}
              />
            </div>
            {editingEntretien.type_entretien === 'visio' && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>🔗 Lien visio</div>
                <Input
                  placeholder="https://meet.google.com/..."
                  value={editingEntretien.lien_visio || ''}
                  onChange={e => setEditingEntretien({ ...editingEntretien, lien_visio: e.target.value })}
                />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>📍 Lieu</div>
              <Input
                value={editingEntretien.lieu}
                onChange={e => setEditingEntretien({ ...editingEntretien, lieu: e.target.value })}
              />
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  )
}

export default N8NCalendarPage
