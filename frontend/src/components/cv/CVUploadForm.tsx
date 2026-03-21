import { Upload, Button, Typography, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';

const { Dragger } = Upload;

const ALLOWED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
const MAX_MB = 5;

interface Props {
  onUpload: (file: File) => void;
  loading?: boolean;
}

export default function CVUploadForm({ onUpload, loading }: Props) {
  const beforeUpload = (file: RcFile) => {
    if (!ALLOWED.includes(file.type)) {
      message.error('Format non supporté. Utilisez PDF, DOCX, JPG ou PNG.');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      message.error(`Fichier trop lourd. La taille maximale est ${MAX_MB}MB.`);
      return Upload.LIST_IGNORE;
    }
    onUpload(file as unknown as File);
    return false; // empêche l'upload auto Ant Design
  };

  return (
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
        Cliquez ou glissez votre CV ici
      </p>
      <p className="ant-upload-hint">
        <Typography.Text type="secondary">
          Formats acceptés : PDF, DOCX, JPG, PNG — Taille max : 5MB
        </Typography.Text>
      </p>
      {loading && <Button loading type="link">Analyse en cours...</Button>}
    </Dragger>
  );
}
