import { useState } from 'react';
import {
  Button, Card, Modal, Form, Input, Space, Typography, Popconfirm,
  Empty, Spin, Tag,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, MailOutlined,
} from '@ant-design/icons';
import {
  useCoverLetters,
  useCreateCoverLetter,
  useUpdateCoverLetter,
  useDeleteCoverLetter,
} from '../../hooks/useCandidate';
import type { CoverLetterOut } from '../../types/cv';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

export default function CoverLettersPage() {
  const { data, isLoading } = useCoverLetters();
  const { mutate: create, isPending: creating } = useCreateCoverLetter();
  const { mutate: update, isPending: updating } = useUpdateCoverLetter();
  const { mutate: remove } = useDeleteCoverLetter();

  const [modal, setModal] = useState<{ open: boolean; editing?: CoverLetterOut }>({ open: false });
  const [form] = Form.useForm();
  const charCount = Form.useWatch('contenu', form)?.length ?? 0;

  const openCreate = () => {
    form.resetFields();
    setModal({ open: true });
  };

  const openEdit = (cl: CoverLetterOut) => {
    form.setFieldsValue({ titre: cl.titre, contenu: cl.contenu });
    setModal({ open: true, editing: cl });
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (modal.editing) {
        update(
          { id: modal.editing.id, data: values },
          { onSuccess: () => setModal({ open: false }) }
        );
      } else {
        create(values, { onSuccess: () => setModal({ open: false }) });
      }
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Lettres de motivation</Title>
          <Text type="secondary">Rédigez et sauvegardez vos lettres pour postuler rapidement.</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          style={{ background: '#8B1A1A', borderColor: '#8B1A1A' }}
        >
          Nouvelle lettre
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : !data?.cover_letters?.length ? (
        <Empty
          image={<MailOutlined style={{ fontSize: 48, color: '#C9A84C' }} />}
          description="Aucune lettre de motivation"
          style={{ padding: 48 }}
        >
          <Button type="primary" onClick={openCreate} style={{ background: '#8B1A1A', borderColor: '#8B1A1A' }}>
            Créer ma première lettre
          </Button>
        </Empty>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          {data.cover_letters.map((cl) => (
            <Card
              key={cl.id}
              size="small"
              title={
                <Space>
                  <MailOutlined style={{ color: '#8B1A1A' }} />
                  <Text strong>{cl.titre}</Text>
                  <Tag color="gold" style={{ fontSize: 11 }}>
                    {cl.contenu.length} / 5000 car.
                  </Tag>
                </Space>
              }
              extra={
                <Space>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(cl.created_at).format('DD/MM/YYYY')}
                  </Text>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => openEdit(cl)}
                  />
                  <Popconfirm
                    title="Supprimer cette lettre ?"
                    onConfirm={() => remove(cl.id)}
                    okText="Oui"
                    cancelText="Non"
                  >
                    <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                  </Popconfirm>
                </Space>
              }
            >
              <Text type="secondary" style={{ fontSize: 13, whiteSpace: 'pre-line' }}>
                {cl.contenu.length > 200 ? cl.contenu.slice(0, 200) + '…' : cl.contenu}
              </Text>
            </Card>
          ))}
        </Space>
      )}

      <Modal
        title={modal.editing ? 'Modifier la lettre' : 'Nouvelle lettre de motivation'}
        open={modal.open}
        onOk={handleSave}
        onCancel={() => setModal({ open: false })}
        confirmLoading={creating || updating}
        okText="Enregistrer"
        cancelText="Annuler"
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="titre" label="Titre" rules={[{ required: true, message: 'Titre requis' }]}>
            <Input
              placeholder="Ex : Lettre pour poste Développeur — RANDA SA"
              maxLength={255}
              showCount
            />
          </Form.Item>
          <Form.Item
            name="contenu"
            label={`Contenu (${charCount}/5000 caractères)`}
            rules={[
              { required: true, message: 'Contenu requis' },
              { max: 5000, message: 'Maximum 5000 caractères' },
            ]}
          >
            <TextArea
              rows={12}
              placeholder="Madame, Monsieur,&#10;&#10;Je me permets de vous adresser ma candidature…"
              maxLength={5000}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
