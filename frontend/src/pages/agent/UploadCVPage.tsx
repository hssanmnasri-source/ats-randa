import { useState } from 'react'
import { Card, Typography, Progress, Tag, Alert, Space, Select } from 'antd'
import CVUploadForm from '../../components/cv/CVUploadForm'
import PageHeader from '../../components/common/PageHeader'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { OCRQuality } from '../../types/agent'
import { COLORS } from '../../theme'
import { msg } from '../../services/messageService'

function OCRFeedbackCard({ quality }: { quality: OCRQuality }) {
  const borderColor =
    quality.niveau === 'EXCELLENT' || quality.niveau === 'BON'
      ? '#52C41A'
      : quality.niveau === 'MOYEN'
      ? COLORS.gold
      : '#FF4D4F'

  return (
    <Card
      style={{
        borderRadius: 12,
        marginTop: 16,
        border: `2px solid ${borderColor}`,
      }}
      size="small"
    >
      <div style={{ fontSize: 16, marginBottom: 10, fontWeight: 600 }}>
        {quality.message}
      </div>
      <Progress
        percent={quality.score}
        strokeColor={
          quality.score >= 70 ? '#52C41A'
          : quality.score >= 40 ? COLORS.gold
          : '#FF4D4F'
        }
        format={(p) => `Qualité : ${p}%`}
      />
      <div style={{ marginTop: 10 }}>
        <Space wrap>
          <Tag>{quality.nb_caracteres} caractères</Tag>
          <Tag color={quality.a_email ? 'green' : 'red'}>
            Email {quality.a_email ? '✅' : '❌'}
          </Tag>
          <Tag color={quality.a_telephone ? 'green' : 'orange'}>
            Téléphone {quality.a_telephone ? '✅' : '⚠️'}
          </Tag>
          <Tag color={quality.a_sections ? 'green' : 'orange'}>
            Structure {quality.a_sections ? '✅' : '⚠️'}
          </Tag>
        </Space>
      </div>
      {quality.conseils.length > 0 && (
        <Alert
          type="warning"
          style={{ marginTop: 12, borderRadius: 8 }}
          message="Conseils pour améliorer la qualité"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {quality.conseils.map((c, i) => (
                <li key={i} style={{ fontSize: 13 }}>{c}</li>
              ))}
            </ul>
          }
        />
      )}
    </Card>
  )
}

export default function UploadCVPage() {
  const qc = useQueryClient()
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [submitted, setSubmitted] = useState(false)

  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['visitor', 'offers-select'],
    queryFn: async () => {
      const res = await api.get('/api/visitor/offers?limit=100')
      return res.data
    },
    staleTime: 5 * 60_000,
  })

  const { mutate: upload, isPending } = useMutation({
    mutationFn: async (payload: { file: File; nom: string; prenom: string; email?: string; telephone?: string }) => {
      const formData = new FormData()
      formData.append('file', payload.file)
      formData.append('nom', payload.nom)
      formData.append('prenom', payload.prenom)
      if (payload.email) formData.append('email', payload.email)
      if (payload.telephone) formData.append('telephone', payload.telephone)
      if (selectedOfferId) formData.append('offer_id', String(selectedOfferId))
      const res = await api.post('/api/agent/cvs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['cvs'] })
      qc.invalidateQueries({ queryKey: ['agent', 'dashboard'] })
      setUploadResult(data)
      msg.success('CV enregistré avec succès.')
    },
    onError: () => msg.error("Erreur lors de l'upload."),
  })

  const offers = offersData?.offres ?? offersData?.items ?? []

  return (
    <div>
      <PageHeader
        title="Upload de CV"
        subtitle="Enregistrez un CV physique pour un candidat"
      />
      <Card style={{ maxWidth: 780 }}>
        {!submitted && (
          <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
            Renseignez les informations du candidat puis joignez le fichier CV.
            Notre IA analysera automatiquement le contenu (PDF, JPG, PNG — max 10MB).
          </Typography.Paragraph>
        )}

        {/* Sélection offre */}
        <div style={{ marginBottom: 20 }}>
          <Typography.Text strong>Associer à une offre</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
            (optionnel)
          </Typography.Text>
          <Select
            style={{ display: 'block', marginTop: 8 }}
            placeholder="Sélectionner une offre..."
            allowClear
            loading={offersLoading}
            onChange={(val) => setSelectedOfferId(val ?? null)}
            options={offers.map((o: any) => ({ value: o.id, label: o.titre }))}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>

        <CVUploadForm
          onUpload={(payload) => {
            setSubmitted(true)
            upload(payload)
          }}
          loading={isPending}
          onSuccess={!!uploadResult && !isPending}
        />

        {uploadResult?.ocr_quality && (
          <OCRFeedbackCard quality={uploadResult.ocr_quality} />
        )}
      </Card>
    </div>
  )
}
