import { Form, Input, InputNumber, Select, Button, Space } from 'antd';
import type { CreateOfferRequest } from '../../types/offer';

interface Props {
  initialValues?: Partial<CreateOfferRequest>;
  onSubmit: (values: CreateOfferRequest) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export default function OfferForm({ initialValues, onSubmit, loading, onCancel }: Props) {
  const [form] = Form.useForm<CreateOfferRequest>();

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      requiredMark="optional"
    >
      <Form.Item
        name="titre"
        label="Titre du poste"
        rules={[{ required: true, message: 'Le titre est obligatoire.' }]}
      >
        <Input placeholder="Ex : Développeur Full Stack React/Node" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'La description est obligatoire.' }]}
      >
        <Input.TextArea rows={5} placeholder="Décrivez les missions, responsabilités..." />
      </Form.Item>

      <Form.Item name="competences_requises" label="Compétences requises">
        <Select
          mode="tags"
          placeholder="Tapez une compétence et appuyez sur Entrée"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item name="experience_requise" label="Années d'expérience requises">
        <InputNumber min={0} max={30} placeholder="0" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="langue_requise" label="Langue de travail">
        <Select placeholder="Sélectionnez une langue" allowClear>
          <Select.Option value="ar">Arabe</Select.Option>
          <Select.Option value="fr">Français</Select.Option>
          <Select.Option value="en">Anglais</Select.Option>
          <Select.Option value="fr/en">Bilingue FR/EN</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Enregistrer
          </Button>
          {onCancel && <Button onClick={onCancel}>Annuler</Button>}
        </Space>
      </Form.Item>
    </Form>
  );
}
