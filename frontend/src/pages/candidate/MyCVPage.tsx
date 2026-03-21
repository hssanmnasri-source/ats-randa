import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Empty,
  Alert,
} from 'antd';
import { FileTextOutlined, FormOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useMyCVs, useUploadCV } from '../../hooks/useCVs';
import CVUploadForm from '../../components/cv/CVUploadForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import dayjs from 'dayjs';

const STATUT_COLOR: Record<string, string> = {
  UPLOADED: 'processing',
  PARSING: 'processing',
  INDEXED: 'success',
  ERROR: 'error',
};

const STATUT_LABEL: Record<string, string> = {
  UPLOADED: 'Uploadé',
  PARSING: 'Analyse en cours',
  INDEXED: 'Indexé ✓',
  ERROR: 'Erreur',
};

export default function MyCVPage() {
  const [mode, setMode] = useState<'view' | 'upload' | 'form'>('view');
  const { data: cvList, isLoading } = useMyCVs();
  const { mutate: upload, isPending: uploading } = useUploadCV();

  if (isLoading) return <LoadingSpinner fullPage />;

  const myCv = cvList?.cvs?.[0] ?? null;
  const hasCv = !!myCv;

  return (
    <div>
      <PageHeader
        title="Mon CV"
        subtitle={
          hasCv
            ? 'Votre profil est visible par les recruteurs'
            : 'Créez votre profil pour postuler'
        }
        extra={
          hasCv ? (
            <Button
              icon={<FileTextOutlined />}
              onClick={() => setMode('upload')}
            >
              Mettre à jour le CV
            </Button>
          ) : undefined
        }
      />

      {/* Candidat sans CV */}
      {!hasCv && mode === 'view' && (
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Alert
              message="Vous n'avez pas encore de CV."
              description="Uploadez votre CV ou remplissez le formulaire pour créer votre profil."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          </Col>
          <Col xs={24} md={12}>
            <Card
              hoverable
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                borderColor: '#1a73e8',
              }}
              onClick={() => setMode('upload')}
            >
              <FileTextOutlined
                style={{ fontSize: 48, color: '#1a73e8', marginBottom: 16 }}
              />
              <Typography.Title level={4}>Uploader mon CV</Typography.Title>
              <Typography.Text type="secondary">
                PDF, DOCX, JPG ou PNG — Max 5MB.
                <br />
                Notre IA analysera automatiquement votre profil.
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              hoverable
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                borderColor: '#34a853',
              }}
              onClick={() => setMode('form')}
            >
              <FormOutlined
                style={{ fontSize: 48, color: '#34a853', marginBottom: 16 }}
              />
              <Typography.Title level={4}>Remplir le formulaire</Typography.Title>
              <Typography.Text type="secondary">
                Saisissez directement vos compétences,
                <br />
                expériences et langues maîtrisées.
              </Typography.Text>
            </Card>
          </Col>
        </Row>
      )}

      {/* Mode upload */}
      {mode === 'upload' && (
        <Card
          title="Upload de CV"
          extra={
            <Button type="text" onClick={() => setMode('view')}>
              Retour
            </Button>
          }
          style={{ maxWidth: 600 }}
        >
          <CVUploadForm
            onUpload={(file) =>
              upload(file, { onSuccess: () => setMode('view') })
            }
            loading={uploading}
          />
        </Card>
      )}

      {/* Vue CV existant */}
      {hasCv && mode === 'view' && (
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Card size="small">
              <Typography.Text>
                Statut :{' '}
                <Tag color={STATUT_COLOR[myCv.statut] ?? 'default'}>
                  {STATUT_LABEL[myCv.statut] ?? myCv.statut}
                </Tag>
              </Typography.Text>
              {myCv.fichier_pdf && (
                <Typography.Text type="secondary" style={{ marginLeft: 16 }}>
                  Fichier : {myCv.fichier_pdf}
                </Typography.Text>
              )}
              <Typography.Text type="secondary" style={{ marginLeft: 16 }}>
                <ClockCircleOutlined /> Déposé le{' '}
                {dayjs(myCv.date_depot).format('DD/MM/YYYY')}
              </Typography.Text>
            </Card>
          </Col>

          {/* Entités extraites */}
          <Col xs={24}>
            <Card title="Informations extraites">
              {myCv.cv_entities ? (
                <pre
                  style={{
                    fontSize: 12,
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 6,
                    overflow: 'auto',
                    maxHeight: 400,
                  }}
                >
                  {JSON.stringify(myCv.cv_entities, null, 2)}
                </pre>
              ) : (
                <Empty
                  description="Analyse en cours..."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
