import { useState } from 'react';
import {
  Row, Col, Card, Progress, Tag, Alert, Button, Modal, Form, Input, Select,
  Space, Typography, Divider, Tooltip, Popconfirm, Switch, Checkbox, Avatar,
  Radio,
} from 'antd';
import {
  UserOutlined, BankOutlined, TrophyOutlined, BookOutlined,
  ThunderboltOutlined, GlobalOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import {
  useFullProfile,
  useUpdatePersonal,
  useUpdateProfessional,
  useAddExperience,
  useDeleteExperience,
  useAddSkill,
  useDeleteSkill,
} from '../../hooks/useCandidate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { ExperienceOut, SkillOut } from '../../types/cv';
import { METIERS_CATEGORIES } from '../../data/metiers';

const { Text, Title } = Typography;
const { TextArea } = Input;

const NIVEAUX = ['BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'Doctorat'];
const SKILL_LEVELS = [
  { value: 'BEGINNER',     label: 'Débutant' },
  { value: 'INTERMEDIATE', label: 'Intermédiaire' },
  { value: 'EXPERT',       label: 'Expert' },
];
const SKILL_COLORS: Record<string, string> = {
  BEGINNER: 'blue', INTERMEDIATE: 'gold', EXPERT: 'green',
};
const CONTRACT_TYPES = ['CDI', 'CDD', 'SIVP', 'Freelance', 'Stage', 'Alternance'];
const COMPANY_SIZES = ['< 20 salariés', '20 - 100', '100 - 500', '> 500'];
const COMPANY_CATEGORIES = ['Privée Tunisienne', 'Étrangère', 'Publique / Semi-publique'];
const REGIONS_TN = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte',
  'Béja', 'Jendouba', 'Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia',
  'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine',
  'Tataouine', 'Gafsa', 'Tozeur', 'Kébili',
];

// ── Sector options derived from METIERS_CATEGORIES ────────────────────────────
const SECTOR_OPTIONS = METIERS_CATEGORIES.map((c) => ({
  value: c.categorie,
  label: c.categorie,
}));

function completionColor(pct: number) {
  if (pct >= 80) return '#52C41A';
  if (pct >= 50) return '#C9A84C';
  return '#FF4D4F';
}

function SectionHeader({
  icon, title, filled, onAction, actionLabel = 'Modifier',
}: {
  icon: React.ReactNode;
  title: string;
  filled: boolean;
  onAction: () => void;
  actionLabel?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Space>
        {icon}
        <Text strong>{title}</Text>
        {filled
          ? <CheckCircleOutlined style={{ color: '#52C41A' }} />
          : <ExclamationCircleOutlined style={{ color: '#FAAD14' }} />}
      </Space>
      <Button
        type="link"
        icon={actionLabel === 'Modifier' ? <EditOutlined /> : <PlusOutlined />}
        size="small"
        style={{ color: '#8B1A1A', padding: 0 }}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function EmptySection({ label }: { label: string }) {
  return (
    <Alert
      title={`${label} non renseigné`}
      type="warning"
      showIcon
      style={{ marginTop: 8 }}
    />
  );
}

export default function CandidateProfilePage() {
  const { data, isLoading } = useFullProfile();
  const { mutate: updatePersonal,      isPending: savingPersonal } = useUpdatePersonal();
  const { mutate: updateProfessional,  isPending: savingPro }      = useUpdateProfessional();
  const { mutate: addExperience,       isPending: addingExp }       = useAddExperience();
  const { mutate: deleteExperience }                                = useDeleteExperience();
  const { mutate: addSkill,            isPending: addingSkill }     = useAddSkill();
  const { mutate: deleteSkill }                                     = useDeleteSkill();

  const [personalModal, setPersonalModal] = useState(false);
  const [proModal,      setProModal]      = useState(false);
  const [expModal,      setExpModal]      = useState(false);
  const [skillModal,    setSkillModal]    = useState(false);

  const [personalForm] = Form.useForm();
  const [proForm]      = Form.useForm();
  const [expForm]      = Form.useForm();
  const [skillForm]    = Form.useForm();

  const isCurrentWatch = Form.useWatch('is_current', expForm);

  if (isLoading) return <LoadingSpinner fullPage />;

  const { profile, completion, experiences, skills, langues } = data!;
  const pct      = completion.total;
  const sections = completion.sections;

  const openPersonal = () => {
    personalForm.setFieldsValue({
      nom: profile.nom, prenom: profile.prenom, telephone: profile.telephone,
      adresse: profile.adresse, date_naissance: profile.date_naissance,
      genre: profile.genre, nationalite: profile.nationalite,
      situation_familiale: profile.situation_familiale,
      has_driving_license: profile.has_driving_license,
      owns_car: profile.owns_car, has_handicap: profile.has_handicap,
      code_postal: profile.code_postal, ville: profile.ville, region: profile.region,
      mobilite_tn: profile.mobilite_tn, mobilite_intl: profile.mobilite_intl,
    });
    setPersonalModal(true);
  };

  const openPro = () => {
    proForm.setFieldsValue({
      titre_poste: profile.titre_poste, niveau_etude: profile.niveau_etude,
      salaire_actuel: profile.salaire_actuel, disponibilite: profile.disponibilite,
      statut_pro: profile.statut_pro,
      secteurs_recherche: profile.secteurs_recherche ?? [],
      metiers_recherche: profile.metiers_recherche ?? [],
    });
    setProModal(true);
  };

  const handlePersonalSave = () => {
    personalForm.validateFields().then((values) => {
      updatePersonal(values, { onSuccess: () => setPersonalModal(false) });
    });
  };

  const handleProSave = () => {
    proForm.validateFields().then((values) => {
      updateProfessional(values, { onSuccess: () => setProModal(false) });
    });
  };

  const handleAddExp = () => {
    expForm.validateFields().then((values) => {
      addExperience(values, {
        onSuccess: () => { setExpModal(false); expForm.resetFields(); },
      });
    });
  };

  const handleAddSkill = () => {
    skillForm.validateFields().then((values) => {
      addSkill(values, {
        onSuccess: () => { setSkillModal(false); skillForm.resetFields(); },
      });
    });
  };

  const isPersonalFilled = sections.personal?.filled ?? false;
  const isProFilled      = sections.professional?.filled ?? false;

  const initials =
    `${(profile.prenom ?? '?')[0] ?? ''}${(profile.nom ?? '?')[0] ?? ''}`.toUpperCase();

  return (
    <div>
      {/* ── Profile Header ──────────────────────────────────────────────────── */}
      <Card
        style={{ marginBottom: 24, borderColor: '#C9A84C' }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row align="middle" gutter={20}>
          <Col>
            <Avatar
              size={72}
              src={profile.photo_url ?? undefined}
              icon={!profile.photo_url && <UserOutlined />}
              style={{ background: '#8B1A1A', fontSize: 26, flexShrink: 0 }}
            >
              {!profile.photo_url && initials}
            </Avatar>
          </Col>
          <Col flex="auto">
            <Title level={4} style={{ margin: 0 }}>
              {profile.prenom} {profile.nom}
            </Title>
            {profile.titre_poste && (
              <Text style={{ color: '#8B1A1A', fontSize: 14 }}>{profile.titre_poste}</Text>
            )}
            <Space wrap style={{ marginTop: 6 }}>
              {profile.email && (
                <Text type="secondary" style={{ fontSize: 12 }}>{profile.email}</Text>
              )}
              {profile.telephone && (
                <Text type="secondary" style={{ fontSize: 12 }}>{profile.telephone}</Text>
              )}
              {(profile.ville || profile.region) && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <EnvironmentOutlined style={{ marginRight: 3 }} />
                  {[profile.ville, profile.region].filter(Boolean).join(', ')}
                </Text>
              )}
            </Space>
          </Col>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: completionColor(pct), fontWeight: 600 }}>{pct}%</Text>
                <Progress
                  type="circle"
                  percent={pct}
                  size={48}
                  strokeColor={completionColor(pct)}
                  format={() => ''}
                />
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>Profil complété</Text>
            </div>
          </Col>
        </Row>

        {/* Section tags */}
        <Row gutter={8} style={{ marginTop: 14 }}>
          {Object.entries(sections).map(([key, s]) => (
            <Col key={key}>
              <Tooltip title={`${s.label} — ${s.score}/${s.weight}%`}>
                <Tag color={s.filled ? 'success' : 'warning'} style={{ cursor: 'default', fontSize: 11 }}>
                  {s.label.split(' ')[0]}
                </Tag>
              </Tooltip>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[20, 20]}>
        {/* Personal info */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <SectionHeader
                icon={<UserOutlined style={{ color: '#8B1A1A' }} />}
                title="Informations personnelles"
                filled={isPersonalFilled}
                onAction={openPersonal}
              />
            }
          >
            {isPersonalFilled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <Row gutter={8}>
                  <Col span={12}><Text type="secondary">Genre : </Text><Text>{profile.genre || '—'}</Text></Col>
                  <Col span={12}><Text type="secondary">Naissance : </Text><Text>{profile.date_naissance || '—'}</Text></Col>
                </Row>
                <Row gutter={8}>
                  <Col span={12}><Text type="secondary">Nationalité : </Text><Text>{profile.nationalite || '—'}</Text></Col>
                  <Col span={12}><Text type="secondary">Situation : </Text><Text>{profile.situation_familiale || '—'}</Text></Col>
                </Row>
                {(profile.ville || profile.code_postal) && (
                  <div>
                    <Text type="secondary">Localisation : </Text>
                    <Text>{[profile.code_postal, profile.ville, profile.region].filter(Boolean).join(', ')}</Text>
                  </div>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <Space wrap>
                  <Tag color={profile.has_driving_license ? 'green' : 'default'}>Permis B</Tag>
                  <Tag color={profile.owns_car ? 'green' : 'default'}>Véhicule</Tag>
                  <Tag color={profile.mobilite_tn ? 'green' : 'default'}>Mobilité TN</Tag>
                  <Tag color={profile.mobilite_intl ? 'blue' : 'default'}>Mobilité Intl.</Tag>
                  {profile.has_handicap && <Tag color="orange">RQTH</Tag>}
                </Space>
              </div>
            ) : (
              <EmptySection label="Informations personnelles" />
            )}
          </Card>
        </Col>

        {/* Professional identity */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <SectionHeader
                icon={<BankOutlined style={{ color: '#8B1A1A' }} />}
                title="Identité professionnelle"
                filled={isProFilled}
                onAction={openPro}
              />
            }
          >
            {isProFilled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                {profile.statut_pro && (
                  <Tag color="volcano">{
                    profile.statut_pro === 'EN_POSTE' ? 'En poste'
                    : profile.statut_pro === 'EN_RECHERCHE' ? 'En recherche active'
                    : 'Étudiant / Jeune diplômé'
                  }</Tag>
                )}
                <Row gutter={8}>
                  <Col span={12}><Text type="secondary">Niveau : </Text><Text>{profile.niveau_etude || '—'}</Text></Col>
                  <Col span={12}><Text type="secondary">Dispo : </Text><Text>{profile.disponibilite || '—'}</Text></Col>
                </Row>
                {profile.salaire_actuel && (
                  <div><Text type="secondary">Salaire : </Text><Text>{profile.salaire_actuel}</Text></div>
                )}
                {profile.secteurs_recherche && profile.secteurs_recherche.length > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Secteurs : </Text>
                    <Space wrap>
                      {profile.secteurs_recherche.slice(0, 3).map((s) => (
                        <Tag key={s} color="geekblue" style={{ fontSize: 11 }}>{s}</Tag>
                      ))}
                      {profile.secteurs_recherche.length > 3 && (
                        <Tag style={{ fontSize: 11 }}>+{profile.secteurs_recherche.length - 3}</Tag>
                      )}
                    </Space>
                  </div>
                )}
              </div>
            ) : (
              <EmptySection label="Identité professionnelle" />
            )}
          </Card>
        </Col>

        {/* Experiences */}
        <Col xs={24}>
          <Card
            size="small"
            title={
              <SectionHeader
                icon={<TrophyOutlined style={{ color: '#8B1A1A' }} />}
                title="Expériences professionnelles"
                filled={experiences.length > 0}
                onAction={() => setExpModal(true)}
                actionLabel="Ajouter"
              />
            }
          >
            {experiences.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                {experiences.map((exp: ExperienceOut) => (
                  <Card
                    key={exp.id}
                    size="small"
                    style={{ background: '#FAFAFA', borderColor: '#E8E8E8' }}
                    extra={
                      <Popconfirm
                        title="Supprimer cette expérience ?"
                        onConfirm={() => deleteExperience(exp.id)}
                        okText="Oui"
                        cancelText="Non"
                      >
                        <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                      </Popconfirm>
                    }
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                      <div>
                        <Text strong>{exp.poste}</Text>
                        {exp.entreprise && <Text type="secondary"> · {exp.entreprise}</Text>}
                      </div>
                      <Space size={4} wrap>
                        {exp.type_contrat && <Tag color="blue" style={{ fontSize: 11 }}>{exp.type_contrat}</Tag>}
                        {exp.is_current && <Tag color="green" style={{ fontSize: 11 }}>En cours</Tag>}
                      </Space>
                    </div>
                    {(exp.date_debut || exp.date_fin) && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {exp.date_debut || '?'} — {exp.is_current ? 'Présent' : (exp.date_fin || '?')}
                      </Text>
                    )}
                    {exp.secteur_activite && (
                      <div><Text type="secondary" style={{ fontSize: 12 }}>Secteur : {exp.secteur_activite}</Text></div>
                    )}
                    {(exp.missions || exp.description) && (
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        {(() => {
                          const txt = exp.missions || exp.description || '';
                          return txt.length > 150 ? txt.slice(0, 150) + '…' : txt;
                        })()}
                      </Text>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <EmptySection label="Expériences professionnelles" />
            )}
          </Card>
        </Col>

        {/* Skills */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <SectionHeader
                icon={<ThunderboltOutlined style={{ color: '#8B1A1A' }} />}
                title="Compétences"
                filled={skills.length > 0}
                onAction={() => setSkillModal(true)}
                actionLabel="Ajouter"
              />
            }
          >
            {skills.length > 0 ? (
              <Space wrap>
                {skills.map((skill: SkillOut) => (
                  <Tooltip
                    key={skill.id}
                    title={`${SKILL_LEVELS.find(l => l.value === skill.niveau)?.label ?? skill.niveau} — × pour supprimer`}
                  >
                    <Tag
                      color={SKILL_COLORS[skill.niveau] ?? 'default'}
                      closable
                      onClose={() => deleteSkill(skill.id)}
                      style={{ marginBottom: 4 }}
                    >
                      {skill.nom_competence}
                    </Tag>
                  </Tooltip>
                ))}
              </Space>
            ) : (
              <EmptySection label="Compétences" />
            )}
          </Card>
        </Col>

        {/* Languages */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <Space>
                <GlobalOutlined style={{ color: '#8B1A1A' }} />
                <Text strong>Langues</Text>
                {langues.length > 0
                  ? <CheckCircleOutlined style={{ color: '#52C41A' }} />
                  : <ExclamationCircleOutlined style={{ color: '#FAAD14' }} />}
              </Space>
            }
          >
            {langues.length > 0 ? (
              <Space wrap>
                {langues.map((l, i) => (
                  <Tag key={i} color="geekblue">
                    {l.langue}{l.niveau ? ` — ${l.niveau}` : ''}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Alert
                title="Langues non renseignées — utilisez le formulaire CV pour les ajouter"
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </Card>
        </Col>

        {/* Degrees */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <Space>
                <BookOutlined style={{ color: '#8B1A1A' }} />
                <Text strong>Formation & Diplômes</Text>
                {sections.degrees?.filled
                  ? <CheckCircleOutlined style={{ color: '#52C41A' }} />
                  : <ExclamationCircleOutlined style={{ color: '#FAAD14' }} />}
              </Space>
            }
          >
            {sections.degrees?.filled ? (
              <Tag color="purple">{profile.niveau_etude}</Tag>
            ) : (
              <Alert
                title="Formations non renseignées — utilisez le formulaire CV pour les ajouter"
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* Personal info modal */}
      <Modal
        title="Informations personnelles"
        open={personalModal}
        onOk={handlePersonalSave}
        onCancel={() => setPersonalModal(false)}
        confirmLoading={savingPersonal}
        okText="Enregistrer"
        cancelText="Annuler"
        width={680}
      >
        <Form form={personalForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="prenom" label="Prénom">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nom" label="Nom">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="genre" label="Genre">
                <Select options={[{ value: 'M', label: 'Homme' }, { value: 'F', label: 'Femme' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date_naissance" label="Date de naissance">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="situation_familiale" label="Situation familiale">
                <Select
                  options={[
                    { value: 'Célibataire', label: 'Célibataire' },
                    { value: 'Marié(e)',    label: 'Marié(e)' },
                    { value: 'Divorcé(e)', label: 'Divorcé(e)' },
                    { value: 'Veuf(ve)',   label: 'Veuf(ve)' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nationalite" label="Nationalité">
                <Input placeholder="Ex : Tunisienne" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="telephone" label="Téléphone">
                <Input placeholder="+216 XX XXX XXX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="adresse" label="Adresse (rue)">
                <Input placeholder="Numéro, Rue, Quartier" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ fontSize: 13 }}>Localisation</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code_postal" label="Code postal">
                <Input placeholder="1000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ville" label="Ville">
                <Input placeholder="Tunis" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="region" label="Gouvernorat">
                <Select
                  showSearch
                  options={REGIONS_TN.map((r) => ({ value: r, label: r }))}
                  placeholder="Sélectionner"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Mobilité & Extras</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="has_driving_license" label="Permis B" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="owns_car" label="Véhicule personnel" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="has_handicap" label="Situation de handicap" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Mobilité">
                <Space>
                  <Form.Item name="mobilite_tn" valuePropName="checked" noStyle>
                    <Checkbox>Mobilité en Tunisie</Checkbox>
                  </Form.Item>
                  <Form.Item name="mobilite_intl" valuePropName="checked" noStyle>
                    <Checkbox>Mobilité internationale</Checkbox>
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Professional identity modal */}
      <Modal
        title="Identité professionnelle"
        open={proModal}
        onOk={handleProSave}
        onCancel={() => setProModal(false)}
        confirmLoading={savingPro}
        okText="Enregistrer"
        cancelText="Annuler"
        width={620}
      >
        <Form form={proForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="statut_pro" label="Statut professionnel actuel">
            <Radio.Group>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Radio value="EN_POSTE">En poste</Radio>
                <Radio value="EN_RECHERCHE">En recherche active</Radio>
                <Radio value="ETUDIANT">Étudiant / Jeune diplômé</Radio>
              </div>
            </Radio.Group>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="titre_poste" label="Titre du poste / Métier" rules={[{ required: true }]}>
                <Input placeholder="Ex : Développeur Full Stack" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="niveau_etude" label="Niveau d'études">
                <Select options={NIVEAUX.map((n) => ({ value: n, label: n }))} placeholder="Sélectionner" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaire_actuel" label="Salaire actuel / souhaité">
                <Input placeholder="Ex : 2500 TND / mois" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="disponibilite" label="Disponibilité">
                <Select
                  options={[
                    { value: 'Immédiatement',  label: 'Immédiatement' },
                    { value: '1 mois',         label: '1 mois de préavis' },
                    { value: '3 mois',         label: '3 mois de préavis' },
                    { value: 'En poste',       label: 'En poste (non disponible)' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="secteurs_recherche"
            label="Secteurs d'activité recherchés (max 10)"
          >
            <Select
              mode="multiple"
              options={SECTOR_OPTIONS}
              placeholder="Sélectionner des secteurs"
              maxCount={10}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="metiers_recherche" label="Métiers / Postes visés">
            <Select
              mode="tags"
              placeholder="Ex : Développeur Backend, Chef de projet…"
              tokenSeparators={[',']}
              maxCount={20}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add experience modal */}
      <Modal
        title="Ajouter une expérience professionnelle"
        open={expModal}
        onOk={handleAddExp}
        onCancel={() => { setExpModal(false); expForm.resetFields(); }}
        confirmLoading={addingExp}
        okText="Ajouter"
        cancelText="Annuler"
        width={700}
      >
        <Form form={expForm} layout="vertical" style={{ marginTop: 16 }}
          initialValues={{ is_current: false }}>
          <Form.Item name="is_current" valuePropName="checked" style={{ marginBottom: 12 }}>
            <Checkbox>Poste actuel (encore en cours)</Checkbox>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="poste" label="Titre du poste" rules={[{ required: true }]}>
                <Input placeholder="Ex : Développeur Backend" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="entreprise" label="Entreprise" rules={[{ required: true }]}>
                <Input placeholder="Ex : Société XYZ" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="date_debut" label="Début">
                <Input placeholder="MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="date_fin" label="Fin">
                <Input placeholder="MM/YYYY" disabled={isCurrentWatch} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type_contrat" label="Type de contrat">
                <Select
                  options={CONTRACT_TYPES.map((c) => ({ value: c, label: c }))}
                  placeholder="Sélectionner"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="secteur_activite" label="Secteur d'activité">
                <Select
                  showSearch
                  options={SECTOR_OPTIONS}
                  placeholder="Sélectionner"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="taille_entreprise" label="Taille entreprise">
                <Select
                  options={COMPANY_SIZES.map((s) => ({ value: s, label: s }))}
                  placeholder="Choisir"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="categorie_entreprise" label="Catégorie">
                <Select
                  options={COMPANY_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  placeholder="Choisir"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="missions" label="Missions & Réalisations">
            <TextArea
              rows={4}
              placeholder="Décrivez vos principales missions, réalisations et responsabilités…"
              maxLength={2000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add skill modal */}
      <Modal
        title="Ajouter une compétence"
        open={skillModal}
        onOk={handleAddSkill}
        onCancel={() => { setSkillModal(false); skillForm.resetFields(); }}
        confirmLoading={addingSkill}
        okText="Ajouter"
        cancelText="Annuler"
      >
        <Form form={skillForm} layout="vertical" style={{ marginTop: 16 }}
          initialValues={{ niveau: 'INTERMEDIATE' }}>
          <Form.Item name="nom_competence" label="Compétence" rules={[{ required: true }]}>
            <Input placeholder="Ex : Python, React, SQL…" />
          </Form.Item>
          <Form.Item name="niveau" label="Niveau">
            <Select options={SKILL_LEVELS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
