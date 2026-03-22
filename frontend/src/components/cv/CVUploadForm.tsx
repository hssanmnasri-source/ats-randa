import { useState } from 'react';
import { Upload, Button, Typography, Form, Input, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';

const { Dragger } = Upload;

const ALLOWED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
const MAX_MB = 5;

export interface UploadPayload {
  file: File;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
}

interface Props {
  onUpload: (payload: UploadPayload) => void;
  loading?: boolean;
}

export default function CVUploadForm({ onUpload, loading }: Props) {
  const [form] = Form.useForm();
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const beforeUpload = (file: RcFile) => {
    if (!ALLOWED.includes(file.type)) {
      message.error('Format non supporté. Utilisez PDF, DOCX, JPG ou PNG.');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      message.error(`Fichier trop lourd. La taille maximale est ${MAX_MB}MB.`);
      return Upload.LIST_IGNORE;
    }
    setPendingFile(file as unknown as File);
    return false;
  };

  const handleSubmit = (values: { nom: string; prenom: string; email?: string; telephone?: string }) => {
    if (!pendingFile) {
      message.error('Veuillez sélectionner un fichier CV.');
      return;
    }
    onUpload({ file: pendingFile, ...values });
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item label="Prénom" name="prenom" rules={[{ required: true, message: 'Prénom requis' }]}>
        <Input placeholder="Prénom du candidat" />
      </Form.Item>
      <Form.Item label="Nom" name="nom" rules={[{ required: true, message: 'Nom requis' }]}>
        <Input placeholder="Nom du candidat" />
      </Form.Item>
      <Form.Item label="Email" name="email">
        <Input placeholder="email@exemple.com" />
      </Form.Item>
      <Form.Item label="Téléphone" name="telephone">
        <Input placeholder="+216 XX XXX XXX" />
      </Form.Item>
      <Form.Item label="Fichier CV">
        <Dragger
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          beforeUpload={beforeUpload}
          showUploadList={false}
          disabled={loading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {pendingFile ? pendingFile.name : 'Cliquez ou glissez votre CV ici'}
          </p>
          <p className="ant-upload-hint">
            <Typography.Text type="secondary">
              Formats acceptés : PDF, DOCX, JPG, PNG — Taille max : 5MB
            </Typography.Text>
          </p>
        </Dragger>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} disabled={!pendingFile}>
          Enregistrer le CV
        </Button>
      </Form.Item>
    </Form>
  );
}
