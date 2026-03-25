import { Form, Input, Select, Button, Space, Checkbox, Radio, InputNumber, Row, Col, DatePicker, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/authStore';
import type { CreateOfferRequest } from '../../types/offer';
import { METIERS_CATEGORIES } from '../../data/metiers';

const { TextArea } = Input;
const { Text } = Typography;

const SIDEBAR_BG = '#3D0C02';
const GOLD_LIGHT = '#F0D080';

const TYPES_POSTE = ['CDI', 'CDD', 'SIVP', 'Fonction publique', 'Indépendant/Freelance', 'Intérim', 'Stage/PFE', 'Stage', 'Saisonnier'];

const LANGUES = ['Arabe', 'Français', 'Anglais', 'Italien', 'Espagnol', 'Allemand', 'Russe', 'Polonais', 'Portugais', 'Néerlandais', 'Tchèque', 'Chinois', 'Japonais'];

const NIVEAUX_ETUDE = ['Sans diplôme', 'Bac', 'Bac+2 / BTS', 'Bac+3 / Licence', 'Bac+4 / Maîtrise', 'Bac+5 / Master', 'Ingénieur', 'Doctorat'];

const NIVEAUX_EXPERIENCE = ['Débutant', 'Junior (1-3 ans)', 'Confirmé (3-5 ans)', 'Senior (5-10 ans)', 'Expert (+10 ans)'];

const REGIONS_TUNISIE = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba',
  'Kairouan', 'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'La Manouba',
  'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana',
  'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
];

const EXPERIENCE_MAP: Record<string, number> = {
  'Débutant': 0,
  'Junior (1-3 ans)': 2,
  'Confirmé (3-5 ans)': 4,
  'Senior (5-10 ans)': 7,
  'Expert (+10 ans)': 12,
};

const LANGUE_CODE_MAP: Record<string, string> = {
  'Arabe': 'ar',
  'Français': 'fr',
  'Anglais': 'en',
  'Italien': 'it',
  'Espagnol': 'es',
  'Allemand': 'de',
  'Russe': 'ru',
  'Polonais': 'pl',
  'Portugais': 'pt',
  'Néerlandais': 'nl',
  'Tchèque': 'cs',
  'Chinois': 'zh',
  'Japonais': 'ja',
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      background: SIDEBAR_BG,
      color: GOLD_LIGHT,
      padding: '10px 16px',
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 20,
      marginLeft: -24,
      marginRight: -24,
      marginTop: 8,
    }}>
      {title}
    </div>
  );
}

interface Props {
  initialValues?: Partial<CreateOfferRequest>;
  onSubmit: (values: CreateOfferRequest) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export default function OfferForm({ initialValues, onSubmit, loading, onCancel }: Props) {
  const [form] = Form.useForm<CreateOfferRequest & { date_publication: dayjs.Dayjs }>();
  const { user } = useAuthStore();

  const handleFinish = (values: CreateOfferRequest & { date_publication: dayjs.Dayjs }) => {
    // Map niveau_experience → experience_requise (for NLP scoring)
    const exp = EXPERIENCE_MAP[values.niveau_experience ?? ''] ?? values.experience_requise ?? 0;
    // Map first langue → langue_requise (for NLP scoring)
    const langues = values.langues ?? [];
    const langueCode = langues.length > 0 ? (LANGUE_CODE_MAP[langues[0]] ?? 'fr') : 'fr';
    // Use metiers as competences_requises for NLP skills scoring
    const competences = values.metiers ?? values.competences_requises ?? [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { date_publication: _dp, ...rest } = values;
    onSubmit({
      ...rest,
      experience_requise: exp,
      langue_requise: langueCode,
      competences_requises: competences,
    });
  };

  const responsableLabel = user ? `${user.prenom} ${user.nom}` : '';

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        pays: 'Tunisie',
        salaire_periode: 'Mois',
        notification_email: 'journalier',
        date_publication: dayjs(),
        ...initialValues,
        langues: initialValues?.langues ?? [],
        metiers: initialValues?.metiers ?? [],
      }}
      onFinish={handleFinish}
      requiredMark={(label, { required }) => (
        <span>{label}{required && <span style={{ color: '#cf1322', marginLeft: 2 }}>*</span>}</span>
      )}
    >
      {/* ── Section 1 : Information sur l'annonce ── */}
      <SectionHeader title="Information sur l'annonce" />

      <Form.Item
        name="titre"
        label="Titre"
        rules={[{ required: true, message: 'Le titre est obligatoire.' }]}
      >
        <Input placeholder="Titre du poste" />
      </Form.Item>

      <Form.Item name="reference_interne" label="Référence interne">
        <Input placeholder="Référence interne (optionnel)" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'La description est obligatoire.' }]}
      >
        <TextArea rows={6} placeholder="Décrivez les missions, responsabilités, profil recherché..." />
      </Form.Item>

      {/* ── Section 2 : Détails de l'annonce ── */}
      <SectionHeader title="Détails de l'annonce" />

      <Form.Item name="type_poste" label="Type de poste">
        <Checkbox.Group>
          <Row gutter={[0, 8]}>
            {TYPES_POSTE.map((t) => (
              <Col span={12} key={t}>
                <Checkbox value={t}>{t}</Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      </Form.Item>

      <Form.Item
        name="disponibilite"
        label="Disponibilité"
        rules={[{ required: true, message: 'La disponibilité est obligatoire.' }]}
      >
        <Radio.Group>
          <Space orientation="vertical">
            <Radio value="Plein temps">Plein temps</Radio>
            <Radio value="Mi-temps">Mi-temps</Radio>
            <Radio value="Flexible">Flexible</Radio>
          </Space>
        </Radio.Group>
      </Form.Item>

      {/* Salaire */}
      <Form.Item label="Salaire net">
        <Row gutter={8} align="middle">
          <Col>
            <Text style={{ color: '#666', fontSize: 13 }}>de</Text>
          </Col>
          <Col>
            <Form.Item name="salaire_min" noStyle>
              <InputNumber min={0} placeholder="Minimum" style={{ width: 130 }} />
            </Form.Item>
          </Col>
          <Col>
            <Text style={{ color: '#666', fontSize: 13 }}>jusqu'à</Text>
          </Col>
          <Col>
            <Form.Item name="salaire_max" noStyle>
              <InputNumber min={0} placeholder="Maximum" style={{ width: 130 }} />
            </Form.Item>
          </Col>
          <Col>
            <Text style={{ color: '#666', fontSize: 13 }}>par</Text>
          </Col>
          <Col>
            <Form.Item name="salaire_periode" noStyle>
              <Select style={{ width: 100 }}>
                <Select.Option value="Mois">Mois</Select.Option>
                <Select.Option value="Jour">Jour</Select.Option>
                <Select.Option value="Heure">Heure</Select.Option>
                <Select.Option value="Année">Année</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
          Les informations de salaire sont facultatives. Laissez vide si vous ne souhaitez pas les renseigner.
        </div>
      </Form.Item>

      <Form.Item
        name="niveau_etude"
        label="Niveau d'étude"
        rules={[{ required: true, message: "Le niveau d'étude est obligatoire." }]}
      >
        <Select placeholder="---------" allowClear>
          {NIVEAUX_ETUDE.map((n) => (
            <Select.Option key={n} value={n}>{n}</Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="niveau_experience"
        label="Niveau d'expérience"
        rules={[{ required: true, message: "Le niveau d'expérience est obligatoire." }]}
      >
        <Select placeholder="---------" allowClear>
          {NIVEAUX_EXPERIENCE.map((n) => (
            <Select.Option key={n} value={n}>{n}</Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="langues" label="Langues">
        <Checkbox.Group>
          <Row gutter={[0, 8]}>
            {LANGUES.map((l) => (
              <Col span={8} key={l}>
                <Checkbox value={l}>{l}</Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      </Form.Item>

      <Form.Item name="permis" valuePropName="checked">
        <Checkbox>Permis de conduire nécessaire</Checkbox>
      </Form.Item>

      <Form.Item
        name="metiers"
        label="Métiers"
        rules={[{ required: true, message: 'Sélectionnez au moins un métier.' }]}
      >
        <Select
          mode="multiple"
          placeholder="Sélectionnez un ou plusieurs métiers"
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
        >
          {METIERS_CATEGORIES.map((cat) => (
            <Select.OptGroup key={cat.categorie} label={cat.categorie}>
              {cat.metiers.map((m) => (
                <Select.Option key={`${cat.categorie}::${m}`} value={m}>{m}</Select.Option>
              ))}
            </Select.OptGroup>
          ))}
        </Select>
      </Form.Item>

      {/* ── Section 3 : Lieu de travail ── */}
      <SectionHeader title="Lieu de travail" />

      <Form.Item
        name="pays"
        label="Pays"
        rules={[{ required: true, message: 'Le pays est obligatoire.' }]}
      >
        <Select>
          <Select.Option value="Tunisie">Tunisie</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="region"
        label="Région"
        rules={[{ required: true, message: 'La région est obligatoire.' }]}
      >
        <Select placeholder="----" allowClear showSearch>
          {REGIONS_TUNISIE.map((r) => (
            <Select.Option key={r} value={r}>{r}</Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="ville" label="Ville">
        <Input placeholder="Ville (optionnel)" />
      </Form.Item>

      <Form.Item label="Mobilité">
        <Space orientation="vertical">
          <Form.Item name="mobilite_locale" valuePropName="checked" noStyle>
            <Checkbox>Avec possibilité de déplacements locaux</Checkbox>
          </Form.Item>
          <Form.Item name="mobilite_internationale" valuePropName="checked" noStyle>
            <Checkbox>Avec possibilité de déplacements internationaux</Checkbox>
          </Form.Item>
        </Space>
      </Form.Item>

      {/* ── Section 4 : Paramètres de l'annonce ── */}
      <SectionHeader title="Paramètres de l'annonce" />

      <Form.Item name="anonyme" valuePropName="checked">
        <Checkbox>Afficher l'annonce en mode anonyme</Checkbox>
      </Form.Item>

      <Form.Item
        name="date_publication"
        label="Date de publication"
        rules={[{ required: true, message: 'La date de publication est obligatoire.' }]}
      >
        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item label="Responsable">
        <Input value={responsableLabel} disabled />
      </Form.Item>

      <Form.Item label={<span><LockOutlined style={{ marginRight: 4 }} />URL pour postuler</span>}>
        <Input
          disabled
          placeholder="URL externe pour postuler à l'offre."
          suffix={
            <span style={{ color: '#8B1A1A', fontSize: 12, fontWeight: 600 }}>Premium</span>
          }
        />
        <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
          🔒 Cette fonctionnalité est uniquement disponible pour les comptes Premium.
        </div>
      </Form.Item>

      <Form.Item
        name="notification_email"
        label="Notification des candidatures par email"
        rules={[{ required: true, message: 'Ce champ est obligatoire.' }]}
      >
        <Radio.Group>
          <Space orientation="vertical">
            <Radio value="journalier">Recevoir un email journalier</Radio>
            <Radio value="chaque">Recevoir un email pour chaque candidature</Radio>
            <Radio value="aucune">Aucune</Radio>
          </Space>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="email_responsable"
        label="Email"
        rules={[
          { required: true, message: "L'email est obligatoire." },
          { type: 'email', message: "Format d'email invalide." },
        ]}
      >
        <Input placeholder="Email du responsable de l'annonce" />
      </Form.Item>

      {/* ── Actions ── */}
      <Form.Item style={{ marginTop: 24 }}>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ background: '#8B1A1A', borderColor: '#8B1A1A' }}
          >
            Enregistrer l'annonce
          </Button>
          {onCancel && (
            <Button onClick={onCancel}>Annuler</Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
}
