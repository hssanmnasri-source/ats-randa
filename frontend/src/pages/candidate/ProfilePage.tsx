import { useState } from 'react';
import {
  Row, Col, Card, Progress, Tag, Alert, Button, Modal, Form, Input, Select,
  Space, Typography, Divider, Tooltip, Popconfirm, Switch,
} from 'antd';
import {
  UserOutlined, BankOutlined, TrophyOutlined, BookOutlined,
  ThunderboltOutlined, GlobalOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  useFullProfile,
  useUpdateProfile,
  useAddExperience,
  useDeleteExperience,
  useAddSkill,
  useDeleteSkill,
} from '../../hooks/useCandidate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { ExperienceOut, SkillOut } from '../../types/cv';

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
        icon={<PlusOutlined />}
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
      message={`${label} non renseigné`}
      type="warning"
      showIcon
      style={{ marginTop: 8 }}
    />
  );
}

export default function CandidateProfilePage() {
  const { data, isLoading } = useFullProfile();
  const { mutate: updateProfile, isPending: savingProfile } = useUpdateProfile();
  const { mutate: addExperience, isPending: addingExp } = useAddExperience();
  const { mutate: deleteExperience } = useDeleteExperience();
  const { mutate: addSkill, isPending: addingSkill } = useAddSkill();
  const { mutate: deleteSkill } = useDeleteSkill();

  const [personalModal, setPersonalModal] = useState(false);
  const [proModal, setProModal] = useState(false);
  const [expModal, setExpModal] = useState(false);
  const [skillModal, setSkillModal] = useState(false);

  const [personalForm] = Form.useForm();
  const [proForm] = Form.useForm();
  const [expForm] = Form.useForm();
  const [skillForm] = Form.useForm();

  if (isLoading) return <LoadingSpinner fullPage />;

  const { profile, completion, experiences, skills, langues } = data!;
  const pct = completion.total;
  const sections = completion.sections;

  const openPersonal = () => {
    personalForm.setFieldsValue({
      nom: profile.nom, prenom: profile.prenom, telephone: profile.telephone,
      adresse: profile.adresse, date_naissance: profile.date_naissance,
      genre: profile.genre, nationalite: profile.nationalite,
      situation_familiale: profile.situation_familiale,
      has_driving_license: profile.has_driving_license,
      owns_car: profile.owns_car, has_handicap: profile.has_handicap,
    });
    setPersonalModal(true);
  };

  const openPro = () => {
    proForm.setFieldsValue({
      titre_poste: profile.titre_poste, niveau_etude: profile.niveau_etude,
      salaire_actuel: profile.salaire_actuel, disponibilite: profile.disponibilite,
    });
    setProModal(true);
  };

  const handlePersonalSave = () => {
    personalForm.validateFields().then((values) => {
      updateProfile(values, { onSuccess: () => setPersonalModal(false) });
    });
  };

  const handleProSave = () => {
    proForm.validateFields().then((values) => {
      updateProfile(values, { onSuccess: () => setProModal(false) });
    });
  };

  const handleAddExp = () => {
    expForm.validateFields().then((values) => {
      addExperience(values, { onSuccess: () => { setExpModal(false); expForm.resetFields(); } });
    });
  };

  const handleAddSkill = () => {
    skillForm.validateFields().then((values) => {
      addSkill(values, { onSuccess: () => { setSkillModal(false); skillForm.resetFields(); } });
    });
  };

  const isPersonalFilled = sections.personal?.filled ?? false;
  const isProFilled = sections.professional?.filled ?? false;

  return (
    <div>
      <Title level={4} style={{ marginBottom: 4 }}>Mon Profil CV</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        Complétez votre profil pour augmenter vos chances d'être contacté par les recruteurs.
      </Text>

      {/* Completion bar */}
      <Card style={{ marginBottom: 24, borderColor: completionColor(pct) }} bodyStyle={{ padding: '16px 20px' }}>
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text strong>Profil complété</Text>
              <Text strong style={{ color: completionColor(pct) }}>{pct}%</Text>
            </div>
            <Progress
              percent={pct}
              strokeColor={completionColor(pct)}
              showInfo={false}
            />
          </Col>
        </Row>
        <Row gutter={8} style={{ marginTop: 12 }}>
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
                actionLabel="Modifier"
              />
            }
          >
            {isPersonalFilled ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row gutter={8}>
                  <Col span={12}><Text type="secondary">Nom : </Text><Text>{profile.nom} {profile.prenom}</Text></Col>
                  <Col span={12}><Text type="secondary">Tél : </Text><Text>{profile.telephone || '—'}</Text></Col>
                </Row>
                <Row gutter={8}>
                  <Col span={12}><Text type="secondary">Genre : </Text><Text>{profile.genre || '—'}</Text></Col>
                  <Col span={12}><Text type="secondary">Naissance : </Text><Text>{profile.date_naissance || '—'}</Text></Col>
                </Row>
                <Row gutter={8}>
                  <Col span={24}><Text type="secondary">Adresse : </Text><Text>{profile.adresse || '—'}</Text></Col>
                </Row>
                <Row gutter={8}>
                  <Col span={12}><Text type="secondary">Nationalité : </Text><Text>{profile.nationalite || '—'}</Text></Col>
                  <Col span={12}><Text type="secondary">Situation : </Text><Text>{profile.situation_familiale || '—'}</Text></Col>
                </Row>
                <Divider style={{ margin: '8px 0' }} />
                <Space>
                  <Tag color={profile.has_driving_license ? 'green' : 'default'}>Permis B</Tag>
                  <Tag color={profile.owns_car ? 'green' : 'default'}>Véhicule</Tag>
                  {profile.has_handicap && <Tag color="orange">RQTH</Tag>}
                </Space>
              </Space>
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
                actionLabel="Modifier"
              />
            }
          >
            {isProFilled ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {profile.titre_poste && (
                  <Tag color="volcano" style={{ fontSize: 13, padding: '2px 10px' }}>{profile.titre_poste}</Tag>
                )}
                <Row gutter={8}>
                  <Col span={12}><Text type="secondary">Niveau : </Text><Text>{profile.niveau_etude || '—'}</Text></Col>
                  <Col span={12}><Text type="secondary">Dispo : </Text><Text>{profile.disponibilite || '—'}</Text></Col>
                </Row>
                {profile.salaire_actuel && (
                  <div><Text type="secondary">Salaire actuel : </Text><Text>{profile.salaire_actuel}</Text></div>
                )}
              </Space>
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
              <Space direction="vertical" style={{ width: '100%' }}>
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
                    <Text strong>{exp.poste}</Text>
                    {exp.entreprise && <Text type="secondary"> · {exp.entreprise}</Text>}
                    {(exp.date_debut || exp.date_fin) && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {exp.date_debut || '?'} — {exp.date_fin || 'Présent'}
                        </Text>
                      </div>
                    )}
                    {exp.description && (
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        {exp.description.length > 120 ? exp.description.slice(0, 120) + '…' : exp.description}
                      </Text>
                    )}
                  </Card>
                ))}
              </Space>
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
                  <Tooltip key={skill.id} title={`${SKILL_LEVELS.find(l => l.value === skill.niveau)?.label ?? skill.niveau} — cliquer ×  pour supprimer`}>
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
                message="Langues non renseignées — utilisez le formulaire CV pour les ajouter"
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
                message="Formations non renseignées — utilisez le formulaire CV pour les ajouter"
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
        confirmLoading={savingProfile}
        okText="Enregistrer"
        cancelText="Annuler"
        width={600}
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
              <Form.Item name="adresse" label="Adresse">
                <Input placeholder="Ville, Pays" />
              </Form.Item>
            </Col>
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
          </Row>
        </Form>
      </Modal>

      {/* Professional identity modal */}
      <Modal
        title="Identité professionnelle"
        open={proModal}
        onOk={handleProSave}
        onCancel={() => setProModal(false)}
        confirmLoading={savingProfile}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form form={proForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="titre_poste" label="Titre du poste / Métier" rules={[{ required: true }]}>
            <Input placeholder="Ex : Développeur Full Stack" />
          </Form.Item>
          <Form.Item name="niveau_etude" label="Niveau d'études">
            <Select
              options={NIVEAUX.map((n) => ({ value: n, label: n }))}
              placeholder="Sélectionner"
            />
          </Form.Item>
          <Form.Item name="salaire_actuel" label="Salaire actuel">
            <Input placeholder="Ex : 2500 TND / mois" />
          </Form.Item>
          <Form.Item name="disponibilite" label="Disponibilité">
            <Select
              options={[
                { value: 'Immédiatement', label: 'Immédiatement' },
                { value: '1 mois',        label: '1 mois de préavis' },
                { value: '3 mois',        label: '3 mois de préavis' },
                { value: 'En poste',      label: 'En poste (non disponible)' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add experience modal */}
      <Modal
        title="Ajouter une expérience"
        open={expModal}
        onOk={handleAddExp}
        onCancel={() => { setExpModal(false); expForm.resetFields(); }}
        confirmLoading={addingExp}
        okText="Ajouter"
        cancelText="Annuler"
        width={600}
      >
        <Form form={expForm} layout="vertical" style={{ marginTop: 16 }}>
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
            <Col span={12}>
              <Form.Item name="date_debut" label="Date de début">
                <Input placeholder="Ex : 01/2020" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date_fin" label="Date de fin">
                <Input placeholder="Ex : 12/2022 ou Présent" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Missions et tâches">
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
