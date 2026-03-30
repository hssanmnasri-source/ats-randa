import { useState } from 'react'
import { Upload, Button, Card, Typography, Select, Progress, Tag, Row, Col, Space, Divider } from 'antd'
import { InboxOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useBatchUpload } from '../../hooks/useAgent'
import type { BatchUploadResult } from '../../types/agent'
import { COLORS } from '../../theme'
import PageHeader from '../../components/common/PageHeader'
import api from '../../services/api'

const { Dragger } = Upload

export default function BatchUploadPage() {
  const qc = useQueryClient()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null)
  const [batchResult, setBatchResult] = useState<any>(null)

  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['visitor', 'offers-select'],
    queryFn: async () => {
      const res = await api.get('/api/visitor/offers?limit=100')
      return res.data
    },
    staleTime: 5 * 60_000,
  })

  const { mutate: batchUpload, isPending } = useBatchUpload()

  const offers = offersData?.offres ?? offersData?.items ?? []

  const handleUpload = () => {
    if (fileList.length === 0) return
    const formData = new FormData()
    fileList.forEach((f) => {
      if (f.originFileObj) formData.append('files', f.originFileObj)
    })
    if (selectedOfferId) formData.append('offer_id', String(selectedOfferId))

    batchUpload(formData, {
      onSuccess: (data) => {
        setBatchResult(data)
        qc.invalidateQueries({ queryKey: ['agent', 'dashboard'] })
        qc.invalidateQueries({ queryKey: ['cvs'] })
      },
    })
  }

  const handleReset = () => {
    setFileList([])
    setBatchResult(null)
    setSelectedOfferId(null)
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']

  return (
    <div>
      <PageHeader
        title="Scan en masse"
        subtitle="Uploadez jusqu'à 10 CVs en une seule session"
      />

      <Card style={{ maxWidth: 820 }}>
        {!batchResult ? (
          <>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
              Glissez-déposez plusieurs CVs (PDF, JPG, PNG) en une seule fois.
              Chaque fichier sera analysé par OCR et indexé automatiquement.
            </Typography.Paragraph>

            {/* Sélection offre */}
            <div style={{ marginBottom: 20 }}>
              <Typography.Text strong>Associer à une offre</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>(optionnel)</Typography.Text>
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

            <Dragger
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              fileList={fileList}
              beforeUpload={(file) => {
                if (!ALLOWED_TYPES.includes(file.type)) return Upload.LIST_IGNORE
                if (file.size > 10 * 1024 * 1024) return Upload.LIST_IGNORE
                return false
              }}
              onChange={({ fileList: newList }) => {
                if (newList.length > 10) {
                  setFileList(newList.slice(0, 10))
                } else {
                  setFileList(newList)
                }
              }}
              style={{ borderRadius: 8, marginBottom: 20 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: COLORS.primary }} />
              </p>
              <p className="ant-upload-text">Glissez-déposez vos fichiers ici</p>
              <p className="ant-upload-hint">
                <Typography.Text type="secondary">
                  PDF, JPG, PNG — maximum 10 fichiers — max 10MB par fichier
                </Typography.Text>
              </p>
            </Dragger>

            <Space>
              <Button
                type="primary"
                loading={isPending}
                disabled={fileList.length === 0}
                onClick={handleUpload}
                style={{ background: COLORS.primary, borderColor: COLORS.primary }}
              >
                Uploader {fileList.length > 0 ? `${fileList.length} fichier${fileList.length > 1 ? 's' : ''}` : ''}
              </Button>
              {fileList.length > 0 && (
                <Button onClick={() => setFileList([])}>Vider la sélection</Button>
              )}
            </Space>
          </>
        ) : (
          <>
            {/* Résumé */}
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#52C41A' }}>{batchResult.reussis}</div>
                  <div style={{ color: '#595959' }}>réussis</div>
                </div>
              </Col>
              <Col>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: batchResult.erreurs > 0 ? '#FF4D4F' : '#ccc' }}>
                    {batchResult.erreurs}
                  </div>
                  <div style={{ color: '#595959' }}>erreurs</div>
                </div>
              </Col>
              <Col>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.primary }}>{batchResult.total}</div>
                  <div style={{ color: '#595959' }}>total</div>
                </div>
              </Col>
            </Row>

            <Divider />

            {/* Résultats par fichier */}
            {batchResult.resultats.map((r: BatchUploadResult, i: number) => (
              <div key={i} style={{
                border: `1px solid ${r.statut === 'OK' ? '#b7eb8f' : '#ffa39e'}`,
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 12,
                background: r.statut === 'OK' ? '#f6ffed' : '#fff2f0',
              }}>
                <Row align="middle" gutter={12}>
                  <Col>
                    {r.statut === 'OK'
                      ? <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 18 }} />
                      : <CloseCircleOutlined style={{ color: '#FF4D4F', fontSize: 18 }} />
                    }
                  </Col>
                  <Col flex="1">
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.fichier}</div>
                    <div style={{ color: '#595959', fontSize: 12 }}>{r.message}</div>
                    {r.cv_id && <Tag color="blue" style={{ marginTop: 4 }}>CV #{r.cv_id}</Tag>}
                  </Col>
                  {r.ocr_quality && (
                    <Col>
                      <Progress
                        type="circle"
                        percent={r.ocr_quality.score}
                        width={50}
                        strokeColor={
                          r.ocr_quality.score >= 70 ? '#52C41A'
                          : r.ocr_quality.score >= 40 ? COLORS.gold
                          : '#FF4D4F'
                        }
                        format={(p) => `${p}%`}
                      />
                    </Col>
                  )}
                </Row>
              </div>
            ))}

            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              style={{ marginTop: 8 }}
            >
              Nouveau batch
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
