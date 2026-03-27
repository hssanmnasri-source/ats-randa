import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Tag, Button, Empty, Alert,
  Spin, Steps, Space, Divider,
} from 'antd';
import {
  FormOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  UploadOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMyCVs, useUploadCV, useCVForm, useMyCV } from '../../hooks/useCVs';
import CVUploadForm from '../../components/cv/CVUploadForm';
import CVReviewForm from '../../components/cv/CVReviewForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import type { CVFormIn } from '../../types/cv';
import { computeConfidence } from '../../types/cv';
import { COLORS } from '../../theme';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

// ── Status config ─────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  UPLOADED: { label: 'Reçu',           color: 'processing', step: 0 },
  PARSING:  { label: 'Analyse…',       color: 'processing', step: 1 },
  INDEXED:  { label: 'Indexé ✓',       color: 'success',    step: 2 },
  ERROR:    { label: 'Erreur',         color: 'error',      step: 1 },
};

const NIVEAUX_ETUDE   = ['BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'Doctorat'];
const LANGUES_OPTIONS = ['Arabe', 'Français', 'Anglais', 'Espagnol', 'Autre'];
const DISPONIBILITE_OPTIONS = ['Immédiate', 'Avec préavis', '1 mois', '3 mois'];

type Mode = 'view' | 'choose' | 'upload' | 'form' | 'review';

// ── Component ─────────────────────────────────────────────────────────────────

export default function MyCVPage() {
  const navigate  = useNavigate();
  const [mode, setMode] = useState<Mode>('view');

  const { data: cvList, isLoading } = useMyCVs();
  const { mutate: upload,     isPending: uploading   } = useUploadCV();
  const { mutate: submitForm, isPending: submitting  } = useCVForm();

  const myCv   = cvList?.cvs?.[0] ?? null;
  const hasCv  = !!myCv;

  // Poll the latest CV status while UPLOADED/PARSING.
  // Start polling based on the list entry; stop once liveCv (which includes the
  // polled fresh data) no longer shows an in-progress status.
  const mightBeProcessing = myCv && (myCv.statut === 'UPLOADED' || myCv.statut === 'PARSING');
  const { data: freshCv } = useMyCV(mightBeProcessing ? myCv?.id : undefined);
  const liveCv = freshCv ?? myCv;
  const isProcessing = liveCv && (liveCv.statut === 'UPLOADED' || liveCv.statut === 'PARSING');

  // Auto-switch to review once indexing completes
  useEffect(() => {
    if (freshCv?.statut === 'INDEXED' && mode === 'view') {
      setMode('review');
    }
  }, [freshCv?.statut, mode]);

  if (isLoading) return <LoadingSpinner fullPage />;

  const status = liveCv ? (STATUT_CONFIG[liveCv.statut] ?? { label: liveCv.statut, color: 'default', step: 0 }) : null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleUploadSuccess = () => { setMode('view'); };
  const handleFormSubmit    = (values: { langues_simple?: string[] } & CVFormIn) => {
    const { langues_simple, ...rest } = values as { langues_simple?: string[] } & CVFormIn;
    const payload: CVFormIn = { ...rest, langues: langues_simple?.map((l) => ({ langue: l })) };
    submitForm(payload, { onSuccess: () => setMode('view') });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Mon CV"
        subtitle={hasCv ? 'Votre profil est visible par les recruteurs' : 'Créez votre profil pour postuler'}
        extra={
          hasCv && mode === 'view' ? (
            <Space>
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => navigate('/candidate/cv-generator')}
                style={{ borderColor: COLORS.primary, color: COLORS.primary }}
              >
                Voir mon CV
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={() => setMode('upload')}
                style={{ borderColor: COLORS.primary, color: COLORS.primary }}
              >
                Mettre à jour
              </Button>
            </Space>
          ) : undefined
        }
      />

      {/* ── No CV → choose mode ─────────────────────────────────────── */}
      {!hasCv && mode === 'view' && (
        <Row gutter={[20, 20]}>
          <Col xs={24}>
            <Alert
              title="Vous n'avez pas encore de CV."
              description="Uploadez votre CV existant ou remplissez le formulaire pour créer votre profil."
              type="info"
              showIcon
            />
          </Col>
          <Col xs={24} md={12}>
            <Card
              hoverable
              onClick={() => setMode('upload')}
              style={{ textAlign: 'center', borderColor: COLORS.primary, cursor: 'pointer' }}
            >
              <UploadOutlined style={{ fontSize: 44, color: COLORS.primary, marginBottom: 12 }} />
              <Title level={4} style={{ margin: 0 }}>Uploader mon CV</Title>
              <Text type="secondary">
                PDF, DOCX, JPG ou PNG — Max 5 Mo.<br />
                Notre IA analysera automatiquement votre profil.
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              hoverable
              onClick={() => setMode('form')}
              style={{ textAlign: 'center', borderColor: COLORS.gold, cursor: 'pointer' }}
            >
              <FormOutlined style={{ fontSize: 44, color: COLORS.gold, marginBottom: 12 }} />
              <Title level={4} style={{ margin: 0 }}>Remplir le formulaire</Title>
              <Text type="secondary">
                Saisissez directement vos compétences,<br />
                expériences et langues maîtrisées.
              </Text>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── Upload mode ─────────────────────────────────────────────── */}
      {mode === 'upload' && (
        <Card
          title={<Text strong>Upload de CV</Text>}
          extra={<Button type="text" onClick={() => setMode('view')}>Annuler</Button>}
          style={{ maxWidth: 600 }}
        >
          <CVUploadForm
            onUpload={(payload) => upload(payload.file, { onSuccess: handleUploadSuccess })}
            loading={uploading}
          />
        </Card>
      )}

      {/* ── Form mode ───────────────────────────────────────────────── */}
      {mode === 'form' && (
        <Card
          title={<Text strong>Créer mon CV</Text>}
          extra={<Button type="text" onClick={() => setMode('view')}>Annuler</Button>}
          style={{ maxWidth: 720 }}
        >
          {/* Inline simple CV form — same as before */}
          <CVInlineForm onFinish={handleFormSubmit} submitting={submitting} />
        </Card>
      )}

      {/* ── View mode — existing CV ─────────────────────────────────── */}
      {hasCv && mode === 'view' && liveCv && (
        <Row gutter={[20, 20]}>
          <Col xs={24}>
            {/* Pipeline steps */}
            <Card style={{ marginBottom: 0 }}>
              <Steps
                size="small"
                current={status?.step ?? 0}
                status={liveCv.statut === 'ERROR' ? 'error' : undefined}
                items={[
                  { title: 'CV reçu',     icon: <UploadOutlined /> },
                  { title: 'Analyse IA',  icon: isProcessing ? <Spin size="small" /> : <CheckCircleOutlined /> },
                  { title: 'Indexé',      icon: <CheckCircleOutlined /> },
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small" title="Statut du CV">
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Statut</Text>
                  <div>
                    <Tag color={status?.color}>{status?.label}</Tag>
                    {isProcessing && <Spin size="small" style={{ marginLeft: 8 }} />}
                  </div>
                </div>
                {liveCv.fichier_pdf && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Fichier</Text>
                    <div><Text style={{ fontSize: 12 }}>{liveCv.fichier_pdf}</Text></div>
                  </div>
                )}
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Déposé le</Text>
                  <div>
                    <Text style={{ fontSize: 12 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {dayjs(liveCv.date_depot).format('DD/MM/YYYY')}
                    </Text>
                  </div>
                </div>
                {liveCv.score_final > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Score global</Text>
                    <div>
                      <Text strong style={{ color: COLORS.primary }}>
                        {Math.round(liveCv.score_final * 100)}%
                      </Text>
                    </div>
                  </div>
                )}
              </Space>
              {liveCv.statut === 'INDEXED' && (
                <Button
                  block
                  icon={<EditOutlined />}
                  style={{ marginTop: 14, borderColor: COLORS.gold, color: COLORS.gold }}
                  onClick={() => setMode('review')}
                >
                  Réviser les données extraites
                </Button>
              )}
            </Card>
          </Col>

          <Col xs={24} md={16}>
            <Card size="small" title="Données extraites">
              {isProcessing ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Spin size="large" />
                  <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                    Analyse du CV en cours…
                  </Text>
                </div>
              ) : liveCv.cv_entities ? (
                <ExtractedSummary entities={liveCv.cv_entities as Record<string, unknown>} />
              ) : (
                <Empty description="Aucune donnée extraite" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* ── Review mode ─────────────────────────────────────────────── */}
      {mode === 'review' && liveCv && (
        <CVReviewForm
          cv={liveCv}
          onReupload={() => setMode('upload')}
          onValidated={() => setMode('view')}
        />
      )}
    </div>
  );
}

// ── Extracted data summary ────────────────────────────────────────────────────

function ExtractedSummary({ entities }: { entities: Record<string, unknown> }) {
  const conf = computeConfidence(entities);
  const exps = (entities.experiences as Array<Record<string, string>> | undefined) ?? [];
  const comps = (entities.competences as Array<{ nom_competence?: string } | string> | undefined) ?? [];
  const langs = (entities.langues as Array<{ langue?: string }> | undefined) ?? [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {conf.filled}/{conf.total} champs remplis
        </Text>
        <Tag color={conf.level === 'success' ? 'green' : conf.level === 'warning' ? 'orange' : 'red'}>
          {conf.level === 'success' ? 'Bonne extraction' : conf.level === 'warning' ? 'Partielle' : 'Faible'}
        </Tag>
      </div>
      <Divider style={{ margin: '8px 0' }} />

      <Row gutter={[8, 12]}>
        <Col xs={24} sm={12}><InfoLine label="Nom"    value={`${entities.prenom ?? ''} ${entities.nom ?? ''}`.trim()} /></Col>
        <Col xs={24} sm={12}><InfoLine label="Poste"  value={entities.titre_poste as string} /></Col>
        <Col xs={24} sm={12}><InfoLine label="Étude"  value={entities.niveau_etude as string} /></Col>
        <Col xs={24} sm={12}><InfoLine label="Email"  value={entities.email as string} /></Col>
      </Row>

      {exps.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
            Expériences ({exps.length})
          </Text>
          {exps.slice(0, 3).map((e, i) => (
            <div key={i} style={{ fontSize: 12, marginTop: 4 }}>
              • <strong>{e.poste}</strong>{e.entreprise ? ` — ${e.entreprise}` : ''}
            </div>
          ))}
        </>
      )}

      {comps.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
            Compétences ({comps.length})
          </Text>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(comps.slice(0, 8) as Array<{ nom_competence?: string } | string>).map((c, i) => (
              <Tag key={i} style={{ fontSize: 11 }}>
                {typeof c === 'string' ? c : c.nom_competence ?? ''}
              </Tag>
            ))}
            {comps.length > 8 && <Tag>+{comps.length - 8}</Tag>}
          </div>
        </>
      )}

      {langs.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
            Langues
          </Text>
          <div style={{ marginTop: 6 }}>
            {langs.map((l, i) => (
              <Tag key={i} color="blue" style={{ fontSize: 11 }}>{l.langue}</Tag>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', display: 'block' }}>{label}</Text>
      <Text style={{ fontSize: 12 }}>{value || <span style={{ color: COLORS.gold }}>—</span>}</Text>
    </div>
  );
}

// ── Inline form (unchanged logic from old MyCVPage) ───────────────────────────

function CVInlineForm({
  onFinish,
  submitting,
}: {
  onFinish: (v: { langues_simple?: string[] } & CVFormIn) => void;
  submitting: boolean;
}) {
  const [form] = FormHook();
  return (
    <FormComp form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
      <FormComp.Item name="titre_poste" label="Titre du poste souhaité" rules={[{ required: true }]}>
        <Input placeholder="Ex : Développeur Full Stack" />
      </FormComp.Item>
      <FormComp.Item name="resume" label="Résumé professionnel" rules={[{ required: true }, { min: 50 }]}>
        <Input.TextArea rows={4} showCount placeholder="Décrivez votre parcours (min. 50 caractères)..." />
      </FormComp.Item>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormComp.Item name="experience_annees" label="Années d'expérience" rules={[{ required: true }]}>
            <InputNumber min={0} max={50} style={{ width: '100%' }} placeholder="Ex : 3" />
          </FormComp.Item>
        </Col>
        <Col xs={24} sm={12}>
          <FormComp.Item name="niveau_etude" label="Niveau d'études" rules={[{ required: true }]}>
            <Select placeholder="Sélectionnez" options={NIVEAUX_ETUDE.map((n) => ({ label: n, value: n }))} />
          </FormComp.Item>
        </Col>
      </Row>
      <FormComp.Item name="competences" label="Compétences" rules={[{ required: true, type: 'array', min: 1 }]}>
        <Select mode="tags" placeholder="Tapez une compétence…" tokenSeparators={[',']} />
      </FormComp.Item>
      <FormComp.Item name="langues_simple" label="Langues">
        <Select mode="multiple" placeholder="Sélectionnez vos langues"
          options={LANGUES_OPTIONS.map((l) => ({ label: l, value: l }))} />
      </FormComp.Item>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <FormComp.Item name="telephone" label="Téléphone">
            <Input placeholder="+216 XX XXX XXX" />
          </FormComp.Item>
        </Col>
        <Col xs={24} sm={12}>
          <FormComp.Item name="disponibilite" label="Disponibilité">
            <Select placeholder="Sélectionnez" allowClear
              options={DISPONIBILITE_OPTIONS.map((d) => ({ label: d, value: d }))} />
          </FormComp.Item>
        </Col>
      </Row>
      <FormComp.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={submitting}
            style={{ background: COLORS.primary, borderColor: COLORS.primary }}>
            Créer mon CV
          </Button>
        </Space>
      </FormComp.Item>
    </FormComp>
  );
}

// Alias to avoid circular import collision with antd Form
import { Form as FormComp, Input, InputNumber, Select } from 'antd';
const FormHook = () => FormComp.useForm<{ langues_simple?: string[] } & CVFormIn>();
