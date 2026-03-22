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
  Form,
  Input,
  InputNumber,
  Select,
  Space,
} from 'antd';
import {
  FileTextOutlined,
  FormOutlined,
  ClockCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useMyCVs, useUploadCV, useCVForm } from '../../hooks/useCVs';
import CVUploadForm from '../../components/cv/CVUploadForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import type { CVFormIn } from '../../types/cv';
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

const NIVEAUX_ETUDE = ['BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'Doctorat'];
const LANGUES_OPTIONS = ['Arabe', 'Français', 'Anglais', 'Espagnol', 'Autre'];
const DISPONIBILITE_OPTIONS = ['Immédiate', 'Avec préavis', '1 mois', '3 mois'];

type FormValues = Omit<CVFormIn, 'langues'> & { langues_simple?: string[] };

export default function MyCVPage() {
  const [mode, setMode] = useState<'view' | 'upload' | 'form'>('view');
  const { data: cvList, isLoading } = useMyCVs();
  const { mutate: upload, isPending: uploading } = useUploadCV();
  const { mutate: submitForm, isPending: submitting } = useCVForm();
  const [form] = Form.useForm<FormValues>();

  if (isLoading) return <LoadingSpinner fullPage />;

  const myCv = cvList?.cvs?.[0] ?? null;
  const hasCv = !!myCv;

  const handleFormSubmit = (values: FormValues) => {
    const { langues_simple, ...rest } = values;
    const payload: CVFormIn = {
      ...rest,
      langues: langues_simple?.map((l) => ({ langue: l })),
    };
    submitForm(payload, { onSuccess: () => setMode('view') });
  };

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
            <Button icon={<FileTextOutlined />} onClick={() => setMode('upload')}>
              Mettre à jour le CV
            </Button>
          ) : undefined
        }
      />

      {/* No CV — choose mode */}
      {!hasCv && mode === 'view' && (
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Alert
              message="Vous n'avez pas encore de CV."
              description="Uploadez votre CV ou remplissez le formulaire pour créer votre profil."
              type="info"
              showIcon
              style={{ marginBottom: 8 }}
            />
          </Col>
          <Col xs={24} md={12}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer', borderColor: '#1a73e8' }}
              onClick={() => setMode('upload')}
            >
              <FileTextOutlined style={{ fontSize: 48, color: '#1a73e8', marginBottom: 16 }} />
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
              style={{ textAlign: 'center', cursor: 'pointer', borderColor: '#34a853' }}
              onClick={() => setMode('form')}
            >
              <FormOutlined style={{ fontSize: 48, color: '#34a853', marginBottom: 16 }} />
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

      {/* Upload mode */}
      {mode === 'upload' && (
        <Card
          title="Upload de CV"
          extra={<Button type="text" onClick={() => setMode('view')}>Retour</Button>}
          style={{ maxWidth: 600 }}
        >
          <CVUploadForm
            onUpload={(payload) => upload(payload.file, { onSuccess: () => setMode('view') })}
            loading={uploading}
          />
        </Card>
      )}

      {/* Form mode */}
      {mode === 'form' && (
        <Card
          title="Créer mon CV"
          extra={<Button type="text" onClick={() => setMode('view')}>Retour</Button>}
          style={{ maxWidth: 720 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            requiredMark={false}
          >
            <Form.Item
              name="titre_poste"
              label="Titre du poste souhaité"
              rules={[{ required: true, message: 'Champ obligatoire.' }]}
            >
              <Input placeholder="Ex : Développeur Full Stack" />
            </Form.Item>

            <Form.Item
              name="resume"
              label="Résumé professionnel"
              rules={[
                { required: true, message: 'Champ obligatoire.' },
                { min: 50, message: 'Minimum 50 caractères.' },
              ]}
            >
              <Input.TextArea
                rows={4}
                showCount
                placeholder="Décrivez votre parcours et vos objectifs professionnels (min. 50 caractères)..."
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="experience_annees"
                  label="Années d'expérience"
                  rules={[{ required: true, message: 'Champ obligatoire.' }]}
                >
                  <InputNumber min={0} max={50} style={{ width: '100%' }} placeholder="Ex : 3" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="niveau_etude"
                  label="Niveau d'études"
                  rules={[{ required: true, message: 'Champ obligatoire.' }]}
                >
                  <Select
                    placeholder="Sélectionnez"
                    options={NIVEAUX_ETUDE.map((n) => ({ label: n, value: n }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="competences"
              label="Compétences"
              rules={[
                { required: true, message: 'Ajoutez au moins une compétence.' },
                { type: 'array', min: 1, message: 'Ajoutez au moins une compétence.' },
              ]}
            >
              <Select
                mode="tags"
                placeholder="Tapez une compétence et appuyez sur Entrée (ex : React, Python...)"
                tokenSeparators={[',']}
              />
            </Form.Item>

            <Form.Item name="langues_simple" label="Langues maîtrisées">
              <Select
                mode="multiple"
                placeholder="Sélectionnez vos langues"
                options={LANGUES_OPTIONS.map((l) => ({ label: l, value: l }))}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="telephone" label="Téléphone">
                  <Input placeholder="Ex : +216 XX XXX XXX" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="disponibilite" label="Disponibilité">
                  <Select
                    placeholder="Sélectionnez"
                    allowClear
                    options={DISPONIBILITE_OPTIONS.map((d) => ({ label: d, value: d }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={submitting}
                >
                  Créer mon CV
                </Button>
                <Button onClick={() => setMode('view')}>Annuler</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Existing CV view */}
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
