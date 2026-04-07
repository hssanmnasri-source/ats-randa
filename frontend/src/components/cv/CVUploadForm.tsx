import { useState } from 'react';
import { Upload, Button, Typography, Form, Input, Row, Col, Result } from 'antd';
import { msg as message } from '@/services/messageService';
import { InboxOutlined, FilePdfOutlined, FileImageOutlined, SwapOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';
import { useNavigate } from 'react-router-dom';

const { Dragger } = Upload;

const ALLOWED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];
const MAX_MB = 10;

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
  onSuccess?: boolean;
}

function FileIcon({ type }: { type: string }) {
  if (type === 'application/pdf') return <FilePdfOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />;
  return <FileImageOutlined style={{ fontSize: 32, color: '#1677ff' }} />;
}

export default function CVUploadForm({ onUpload, loading, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

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

  // Show success screen after upload
  if (onSuccess && submitted) {
    return (
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title="CV enregistré avec succès"
        subTitle="L'analyse du CV a été lancée automatiquement."
        extra={[
          <Button
            key="another"
            type="primary"
            onClick={() => {
              form.resetFields();
              setPendingFile(null);
              setSubmitted(false);
            }}
          >
            Uploader un autre CV
          </Button>,
          <Button key="list" onClick={() => navigate('/agent/cvs')}>
            Voir mes CVs
          </Button>,
        ]}
      />
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => {
        setSubmitted(true);
        handleSubmit(values);
      }}
    >
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            label="Prénom"
            name="prenom"
            rules={[{ required: true, message: 'Prénom requis' }]}
          >
            <Input placeholder="ex: Mohamed" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Nom"
            name="nom"
            rules={[{ required: true, message: 'Nom requis' }]}
          >
            <Input placeholder="ex: Ben Ali" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            label={<span>Email <Typography.Text type="secondary" style={{ fontSize: 12 }}>(optionnel)</Typography.Text></span>}
            name="email"
            rules={[{ type: 'email', message: 'Adresse email invalide' }]}
          >
            <Input placeholder="email@exemple.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span>Téléphone <Typography.Text type="secondary" style={{ fontSize: 12 }}>(optionnel)</Typography.Text></span>}
            name="telephone"
          >
            <Input placeholder="+216 XX XXX XXX" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Fichier CV" required>
        {pendingFile ? (
          <div
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#fafafa',
            }}
          >
            <FileIcon type={pendingFile.type} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Typography.Text strong ellipsis style={{ display: 'block' }}>
                {pendingFile.name}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {(pendingFile.size / 1024).toFixed(0)} KB
              </Typography.Text>
            </div>
            <Upload
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              beforeUpload={beforeUpload}
              showUploadList={false}
              disabled={loading}
            >
              <Button icon={<SwapOutlined />} size="small">
                Changer
              </Button>
            </Upload>
          </div>
        ) : (
          <Dragger
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            beforeUpload={beforeUpload}
            showUploadList={false}
            disabled={loading}
            style={{ borderRadius: 8 }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Cliquez ou glissez le CV ici</p>
            <p className="ant-upload-hint">
              <Typography.Text type="secondary">
                PDF, DOCX, JPG, PNG — max {MAX_MB}MB
              </Typography.Text>
            </p>
          </Dragger>
        )}
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={!pendingFile}
          block
          size="large"
        >
          Enregistrer le CV
        </Button>
      </Form.Item>
    </Form>
  );
}
