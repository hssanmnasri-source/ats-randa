/**
 * CVReviewForm — Human-in-the-loop review interface.
 * Displays OCR-extracted data in an editable form so the candidate can
 * correct mistakes before final indexing.
 */
import { useEffect } from 'react';
import {
  Alert, Button, Card, Col, Divider, Form, Input,
  Row, Select, Tag, Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { CVOut, CVValidateIn, ConfidenceLevel } from '../../types/cv';
import { computeConfidence } from '../../types/cv';
import { useValidateCV } from '../../hooks/useCVs';
import { COLORS } from '../../theme';

const { Text } = Typography;

// ── Constants ─────────────────────────────────────────────────────────────────

const NIVEAUX_ETUDE   = ['BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'Doctorat'];
const LANGUES_OPTIONS = ['Arabe', 'Français', 'Anglais', 'Espagnol', 'Allemand', 'Autre'];
const DISPO_OPTIONS   = ['Immédiate', 'Avec préavis', '1 mois', '3 mois'];

// ── Alert banner ─────────────────────────────────────────────────────────────

const ALERT_CONFIG: Record<ConfidenceLevel, {
  type: 'success' | 'warning' | 'error';
  icon: React.ReactNode;
  message: string;
  description: string;
}> = {
  success: {
    type: 'success',
    icon: <CheckCircleOutlined />,
    message: 'Extraction réussie !',
    description: 'Vérifiez les informations ci-dessous et corrigez si nécessaire avant de valider.',
  },
  warning: {
    type: 'warning',
    icon: <WarningOutlined />,
    message: 'Certaines zones sont manquantes ou semblent floues.',
    description: 'Merci de compléter manuellement les champs mis en évidence (bordure dorée).',
  },
  error: {
    type: 'error',
    icon: <CloseCircleOutlined />,
    message: "Nous n'avons pas pu lire correctement votre CV.",
    description: 'Remplissez le formulaire ci-dessous manuellement pour compléter votre profil.',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Highlight style for empty fields the OCR missed */
function emptyStyle(value: unknown): React.CSSProperties {
  const empty = !value || (Array.isArray(value) && value.length === 0);
  return empty ? { borderColor: COLORS.gold, boxShadow: `0 0 0 2px ${COLORS.gold}33` } : {};
}

function extractCompetenceNames(raw: unknown): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((c) => (typeof c === 'string' ? c : (c as { nom_competence?: string }).nom_competence ?? ''))
    .filter(Boolean);
}

function extractLangueNames(raw: unknown): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return (raw as Array<{ langue?: string }>).map((l) => l.langue ?? '').filter(Boolean);
}

// ── Form values type ──────────────────────────────────────────────────────────

interface FormValues {
  nom?:          string;
  prenom?:       string;
  telephone?:    string;
  adresse?:      string;
  titre_poste?:  string;
  niveau_etude?: string;
  disponibilite?: string;
  resume?:       string;
  competences:   string[];
  langues_noms:  string[];
  experiences:   Array<{
    poste:        string;
    entreprise?:  string;
    date_debut?:  string;
    date_fin?:    string;
    description?: string;
    is_current:   boolean;
  }>;
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  cv:           CVOut;
  onReupload:   () => void;
  onValidated:  () => void;
}

export default function CVReviewForm({ cv, onReupload, onValidated }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { mutate: validateCV, isPending } = useValidateCV();

  const entities = (cv.cv_entities ?? {}) as Record<string, unknown>;
  const confidence = computeConfidence(entities);
  const alertCfg   = ALERT_CONFIG[confidence.level];

  // Pre-fill the form from cv_entities
  useEffect(() => {
    const expList = Array.isArray(entities.experiences)
      ? (entities.experiences as Array<Record<string, unknown>>).map((e) => ({
          poste:        String(e.poste ?? ''),
          entreprise:   String(e.entreprise ?? ''),
          date_debut:   String(e.date_debut ?? ''),
          date_fin:     String(e.date_fin ?? ''),
          description:  String(e.description ?? ''),
          is_current:   Boolean(e.is_current),
        }))
      : [];

    form.setFieldsValue({
      nom:           String(entities.nom ?? ''),
      prenom:        String(entities.prenom ?? ''),
      telephone:     String(entities.telephone ?? ''),
      adresse:       String(entities.adresse ?? ''),
      titre_poste:   String(entities.titre_poste ?? ''),
      niveau_etude:  String(entities.niveau_etude ?? ''),
      disponibilite: String(entities.disponibilite ?? ''),
      resume:        String(entities.resume ?? ''),
      competences:   extractCompetenceNames(entities.competences),
      langues_noms:  extractLangueNames(entities.langues),
      experiences:   expList.length > 0 ? expList : [{ poste: '', entreprise: '', date_debut: '', date_fin: '', description: '', is_current: false }],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv.id]);

  const handleFinish = (values: FormValues) => {
    const payload: CVValidateIn = {
      nom:           values.nom || undefined,
      prenom:        values.prenom || undefined,
      telephone:     values.telephone || undefined,
      adresse:       values.adresse || undefined,
      titre_poste:   values.titre_poste || undefined,
      niveau_etude:  values.niveau_etude || undefined,
      disponibilite: values.disponibilite || undefined,
      resume:        values.resume || undefined,
      competences:   values.competences ?? [],
      langues:       (values.langues_noms ?? []).map((l) => ({ langue: l })),
      experiences:   (values.experiences ?? [])
        .filter((e) => e.poste?.trim())
        .map((e) => ({
          poste:       e.poste,
          entreprise:  e.entreprise || undefined,
          date_debut:  e.date_debut || undefined,
          date_fin:    e.is_current ? undefined : (e.date_fin || undefined),
          description: e.description || undefined,
          is_current:  e.is_current,
        })),
    };
    validateCV({ cvId: cv.id, data: payload }, { onSuccess: onValidated });
  };

  return (
    <div>
      {/* ── Confidence alert ──────────────────────────────────────────── */}
      <Alert
        type={alertCfg.type}
        icon={alertCfg.icon}
        showIcon
        title={alertCfg.message}
        description={
          <div>
            {alertCfg.description}
            {confidence.missing.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 12 }}>Champs manquants : </Text>
                {confidence.missing.map((m) => (
                  <Tag key={m} color="orange" style={{ marginLeft: 4 }}>{m}</Tag>
                ))}
              </div>
            )}
          </div>
        }
        style={{ marginBottom: 20 }}
      />

      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>

        {/* ── Informations personnelles ──────────────────────────────── */}
        <Card
          size="small"
          title={
            <Text strong style={{ color: COLORS.primary }}>
              Informations personnelles
            </Text>
          }
          style={{ marginBottom: 16, borderColor: COLORS.grayBorder }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="prenom" label="Prénom">
                <Input placeholder="Prénom" style={emptyStyle(entities.prenom)} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="nom" label="Nom">
                <Input placeholder="Nom de famille" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="telephone" label="Téléphone">
                <Input placeholder="+216 XX XXX XXX" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="disponibilite" label="Disponibilité">
                <Select
                  placeholder="Choisir"
                  allowClear
                  options={DISPO_OPTIONS.map((d) => ({ label: d, value: d }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="adresse" label="Adresse">
                <Input placeholder="Ville, Gouvernorat, Tunisie" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ── Identité professionnelle ───────────────────────────────── */}
        <Card
          size="small"
          title={
            <Text strong style={{ color: COLORS.primary }}>
              Identité professionnelle
            </Text>
          }
          style={{ marginBottom: 16, borderColor: COLORS.grayBorder }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={14}>
              <Form.Item
                name="titre_poste"
                label="Titre du profil"
                rules={[{ required: true, message: 'Champ obligatoire.' }]}
              >
                <Input placeholder="Ex : Développeur Full Stack, Comptable..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item name="niveau_etude" label="Niveau d'études">
                <Select
                  placeholder="Sélectionner"
                  allowClear
                  options={NIVEAUX_ETUDE.map((n) => ({ label: n, value: n }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="resume" label="Résumé professionnel">
                <Input.TextArea
                  rows={3}
                  placeholder="Description de votre parcours et de vos objectifs..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ── Expériences ────────────────────────────────────────────── */}
        <Card
          size="small"
          title={
            <Text strong style={{ color: COLORS.primary }}>
              Expériences professionnelles
            </Text>
          }
          style={{ marginBottom: 16, borderColor: COLORS.grayBorder }}
        >
          <Form.List name="experiences">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <div key={field.key}>
                    {index > 0 && <Divider dashed style={{ margin: '12px 0' }} />}
                    <Row gutter={12} align="middle">
                      <Col flex="1">
                        <Row gutter={12}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name={[field.name, 'poste']}
                              label={index === 0 ? 'Poste / Titre' : undefined}
                              rules={[{ required: true, message: 'Titre requis.' }]}
                            >
                              <Input placeholder="Ex : Ingénieur Logiciel" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name={[field.name, 'entreprise']}
                              label={index === 0 ? 'Entreprise' : undefined}
                            >
                              <Input placeholder="Nom de l'entreprise" />
                            </Form.Item>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Form.Item
                              name={[field.name, 'date_debut']}
                              label={index === 0 ? 'Début' : undefined}
                            >
                              <Input placeholder="MM/YYYY ou YYYY" />
                            </Form.Item>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Form.Item
                              name={[field.name, 'date_fin']}
                              label={index === 0 ? 'Fin' : undefined}
                            >
                              <Input placeholder="MM/YYYY ou En cours" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name={[field.name, 'description']}
                              label={index === 0 ? 'Description' : undefined}
                            >
                              <Input.TextArea rows={2} placeholder="Missions, réalisations..." />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Col>
                      <Col flex="none" style={{ paddingTop: index === 0 ? 22 : 0 }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                          disabled={fields.length === 1}
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ poste: '', entreprise: '', date_debut: '', date_fin: '', description: '', is_current: false })}
                  icon={<PlusOutlined />}
                  block
                  style={{ marginTop: 8, borderColor: COLORS.gold, color: COLORS.gold }}
                >
                  Ajouter une expérience
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* ── Compétences ────────────────────────────────────────────── */}
        <Card
          size="small"
          title={
            <Text strong style={{ color: COLORS.primary }}>
              Compétences
            </Text>
          }
          style={{ marginBottom: 16, borderColor: COLORS.grayBorder }}
        >
          <Form.Item
            name="competences"
            rules={[{ type: 'array', min: 1, message: 'Ajoutez au moins une compétence.' }]}
          >
            <Select
              mode="tags"
              placeholder="Tapez une compétence et appuyez sur Entrée (ex : Python, Excel...)"
              tokenSeparators={[',']}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>

        {/* ── Langues ────────────────────────────────────────────────── */}
        <Card
          size="small"
          title={
            <Text strong style={{ color: COLORS.primary }}>
              Langues
            </Text>
          }
          style={{ marginBottom: 20, borderColor: COLORS.grayBorder }}
        >
          <Form.Item name="langues_noms" label="Langues maîtrisées">
            <Select
              mode="multiple"
              placeholder="Sélectionnez vos langues"
              options={LANGUES_OPTIONS.map((l) => ({ label: l, value: l }))}
            />
          </Form.Item>
        </Card>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={onReupload}
            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
          >
            Ré-uploader le CV
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={isPending}
            style={{ background: COLORS.primary, borderColor: COLORS.primary }}
          >
            Enregistrer et valider
          </Button>
        </div>

      </Form>
    </div>
  );
}
