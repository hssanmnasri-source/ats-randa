import React, { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import {
  Card, Modal, Select, InputNumber, DatePicker,
  Button, Table, Tag, Space, Alert,
  Row, Col, message, Drawer
} from 'antd'
import {
  CalendarOutlined, SendOutlined,
  DeleteOutlined, PlusOutlined,
  ClockCircleOutlined, EnvironmentOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { COLORS } from '@/theme'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'

dayjs.locale('fr')

const STATUS_COLORS: Record<string, string> = {
  PLANIFIE: '#C9A84C',
  CONFIRME: '#52C41A',
  ANNULE: '#8B1A1A',
  EFFECTUE: '#1677ff',
}

const CalendarPage: React.FC = () => {
  const qc = useQueryClient()
  const [showPlanifier, setShowPlanifier] = useState(false)
  const [selectedOffre, setSelectedOffre] = useState<number | null>(null)
  const [topN, setTopN] = useState(5)
  const [dateDebut, setDateDebut] = useState<dayjs.Dayjs | null>(null)
  const [duree, setDuree] = useState(30)
  const [lieu, setLieu] = useState('RANDA — ZI BIR EL KASAA BEN AROUS')
  const [typeEntretien, setTypeEntretien] = useState('presentiel')
  const [creneauxSuggeres, setCreneauxSuggeres] = useState<any[]>([])
  const [showConfirmer, setShowConfirmer] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  const { data: calendarData } = useQuery({
    queryKey: ['rh', 'calendar'],
    queryFn: async () => (await api.get('/api/rh/calendar')).data,
    staleTime: 60_000,
  })

  const { data: offresData } = useQuery({
    queryKey: ['rh', 'offers'],
    queryFn: async () => (await api.get('/api/rh/offers')).data,
  })

  const planifierMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/rh/calendar/planifier', {
        id_offre: selectedOffre,
        top_n: topN,
        date_debut: dateDebut?.toISOString(),
        duree_minutes: duree,
        intervalle_minutes: duree + 15,
        lieu,
        type_entretien: typeEntretien,
      })
      return res.data
    },
    onSuccess: (data) => {
      setCreneauxSuggeres(data.creneaux || [])
      setShowPlanifier(false)
      setShowConfirmer(true)
    },
    onError: () => message.error('Erreur lors de la planification'),
  })

  const confirmerMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        id_offre: String(selectedOffre),
        lieu,
        type_entretien: typeEntretien,
        duree_minutes: String(duree),
        envoyer_emails: 'true',
      })
      const res = await api.post(`/api/rh/calendar/confirmer?${params}`, creneauxSuggeres)
      return res.data
    },
    onSuccess: (data) => {
      message.success(`${data.nb_entretiens} entretiens planifies !`)
      setShowConfirmer(false)
      setCreneauxSuggeres([])
      qc.invalidateQueries({ queryKey: ['rh', 'calendar'] })
    },
  })

  const annulerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/rh/calendar/${id}`),
    onSuccess: () => {
      message.success('Entretien annule')
      qc.invalidateQueries({ queryKey: ['rh', 'calendar'] })
    },
  })

  const calendarEvents = (calendarData?.entretiens || []).map((e: any) => ({
    id: String(e.id),
    title: `${e.candidat_prenom || ''} ${e.candidat_nom || ''} — ${e.offre_titre || ''}`,
    start: e.date_entretien,
    end: dayjs(e.date_entretien).add(e.duree_minutes, 'minute').toISOString(),
    backgroundColor: STATUS_COLORS[e.statut] || COLORS.gold,
    borderColor: STATUS_COLORS[e.statut] || COLORS.gold,
    extendedProps: e,
  }))

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkBrown}, ${COLORS.primary})`,
        borderRadius: 16, padding: '24px 32px', marginBottom: 24,
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <div style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>
              Calendrier des entretiens
            </div>
            <div style={{ color: COLORS.goldLight, marginTop: 4 }}>
              {calendarData?.total || 0} entretien(s) planifie(s)
            </div>
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setShowPlanifier(true)}
              style={{ background: COLORS.gold, border: 'none', color: COLORS.darkBrown, fontWeight: 700 }}
            >
              Planifier des entretiens
            </Button>
          </Col>
        </Row>
      </div>

      <Row gutter={8} style={{ marginBottom: 16 }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <Col key={status}>
            <Tag color={color} style={{ fontWeight: 600 }}>{status}</Tag>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 16 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={frLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={calendarEvents}
          eventClick={(info) => setSelectedEvent(info.event.extendedProps)}
          slotMinTime="08:00:00"
          slotMaxTime="18:00:00"
          allDaySlot={false}
          height={600}
        />
      </Card>

      <Modal
        title="Planifier des entretiens"
        open={showPlanifier}
        onCancel={() => setShowPlanifier(false)}
        footer={null}
        width={600}
      >
        <Alert
          type="info"
          message="Le systeme suggere des creneaux pour les candidats retenus. Vous pourrez modifier les dates avant de confirmer."
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />

        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <label style={{ fontWeight: 600, color: COLORS.primary }}>Offre d'emploi</label>
            <Select
              placeholder="Selectionner une offre"
              style={{ width: '100%', marginTop: 6 }}
              value={selectedOffre}
              onChange={setSelectedOffre}
              options={(offresData?.offers || offresData?.items || []).map((o: any) => ({
                value: o.id,
                label: o.titre,
              }))}
            />
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <label style={{ fontWeight: 600, color: COLORS.primary }}>Top N candidats</label>
              <InputNumber
                min={1} max={20} value={topN}
                onChange={(v) => setTopN(v || 5)}
                style={{ width: '100%', marginTop: 6 }}
              />
            </Col>
            <Col span={12}>
              <label style={{ fontWeight: 600, color: COLORS.primary }}>Duree par entretien</label>
              <Select
                value={duree}
                onChange={setDuree}
                style={{ width: '100%', marginTop: 6 }}
                options={[
                  { value: 15, label: '15 minutes' },
                  { value: 30, label: '30 minutes' },
                  { value: 45, label: '45 minutes' },
                  { value: 60, label: '1 heure' },
                  { value: 90, label: '1h30' },
                ]}
              />
            </Col>
          </Row>

          <div>
            <label style={{ fontWeight: 600, color: COLORS.primary }}>Date de debut</label>
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              value={dateDebut}
              onChange={setDateDebut}
              style={{ width: '100%', marginTop: 6 }}
              disabledDate={(d) => d && d < dayjs().startOf('day')}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600, color: COLORS.primary }}>Type d'entretien</label>
            <Select
              value={typeEntretien}
              onChange={setTypeEntretien}
              style={{ width: '100%', marginTop: 6 }}
              options={[
                { value: 'presentiel', label: 'Presentiel' },
                { value: 'visio', label: 'Visioconference' },
                { value: 'telephonique', label: 'Telephonique' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600, color: COLORS.primary }}>Lieu</label>
            <input
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              style={{
                width: '100%', marginTop: 6, padding: '8px 12px',
                border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <Button
            type="primary"
            block
            size="large"
            loading={planifierMutation.isPending}
            disabled={!selectedOffre || !dateDebut}
            onClick={() => planifierMutation.mutate()}
            style={{ background: COLORS.primary, border: 'none', borderRadius: 10, height: 48, fontWeight: 700 }}
          >
            Generer les creneaux suggeres
          </Button>
        </Space>
      </Modal>

      <Modal
        title="Verifier et confirmer les creneaux"
        open={showConfirmer}
        onCancel={() => setShowConfirmer(false)}
        footer={null}
        width={900}
      >
        <Alert
          type="success"
          message={`${creneauxSuggeres.length} creneaux generes — vous pouvez modifier les dates`}
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />

        <Table
          dataSource={creneauxSuggeres}
          rowKey="candidat_id"
          size="middle"
          pagination={false}
          columns={[
            { title: '#', dataIndex: 'rang', width: 50 },
            {
              title: 'Candidat',
              render: (_: any, r: any) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{r.candidat_prenom} {r.candidat_nom}</div>
                  <div style={{ fontSize: 12, color: '#8B8B8B' }}>{r.candidat_email}</div>
                </div>
              ),
            },
            {
              title: 'Score',
              dataIndex: 'score_final',
              render: (s: number) => (
                <Tag color={s >= 0.7 ? '#52C41A' : COLORS.gold} style={{ fontWeight: 700 }}>
                  {Math.round(s * 100)}%
                </Tag>
              ),
            },
            {
              title: 'Creneau (modifiable)',
              key: 'creneau',
              render: (_: any, record: any, index: number) => (
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="DD/MM/YYYY HH:mm"
                  value={dayjs(record.creneau_suggere)}
                  onChange={(date) => {
                    const updated = [...creneauxSuggeres]
                    updated[index] = { ...updated[index], creneau_suggere: date?.toISOString() }
                    setCreneauxSuggeres(updated)
                  }}
                  size="small"
                />
              ),
            },
          ]}
        />

        <Row gutter={12} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Button block onClick={() => setShowConfirmer(false)} style={{ borderRadius: 10, height: 44 }}>
              Modifier les parametres
            </Button>
          </Col>
          <Col span={12}>
            <Button
              type="primary"
              block
              loading={confirmerMutation.isPending}
              onClick={() => confirmerMutation.mutate()}
              icon={<SendOutlined />}
              style={{ background: COLORS.primary, border: 'none', borderRadius: 10, height: 44, fontWeight: 700 }}
            >
              Confirmer et envoyer les invitations
            </Button>
          </Col>
        </Row>
      </Modal>

      {selectedEvent && (
        <Drawer
          title="Detail entretien"
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          width={400}
          extra={
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                annulerMutation.mutate(selectedEvent.id)
                setSelectedEvent(null)
              }}
            >
              Annuler
            </Button>
          }
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.primary }}>
                {selectedEvent.candidat_prenom} {selectedEvent.candidat_nom}
              </div>
              <div style={{ color: '#595959', fontSize: 13 }}>{selectedEvent.candidat_email}</div>
            </div>
            <Tag color={STATUS_COLORS[selectedEvent.statut]} style={{ fontWeight: 600 }}>
              {selectedEvent.statut}
            </Tag>
            {[
              { icon: <CalendarOutlined />, label: 'Date', value: dayjs(selectedEvent.date_entretien).format('dddd DD MMMM YYYY [a] HH:mm') },
              { icon: <ClockCircleOutlined />, label: 'Duree', value: `${selectedEvent.duree_minutes} minutes` },
              { icon: <EnvironmentOutlined />, label: 'Lieu', value: selectedEvent.lieu || 'Non defini' },
            ].map((item) => (
              <div key={item.label} style={{ background: '#F5F5F5', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#8B8B8B', marginBottom: 4 }}>{item.icon} {item.label}</div>
                <div style={{ fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </Space>
        </Drawer>
      )}
    </div>
  )
}

export default CalendarPage
