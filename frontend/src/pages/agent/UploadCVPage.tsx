import { Card, Typography } from 'antd';
import CVUploadForm from '../../components/cv/CVUploadForm';
import PageHeader from '../../components/common/PageHeader';
import { useAgentUploadCV } from '../../hooks/useCVs';

export default function UploadCVPage() {
  const { mutate: upload, isPending } = useAgentUploadCV();

  return (
    <div>
      <PageHeader
        title="Upload de CV"
        subtitle="Enregistrez un CV physique pour un candidat"
      />
      <Card style={{ maxWidth: 600 }}>
        <Typography.Paragraph type="secondary">
          Glissez ou sélectionnez un fichier CV (PDF, DOCX, JPG, PNG — max 5MB).
          Notre IA analysera automatiquement le contenu.
        </Typography.Paragraph>
        <CVUploadForm
          onUpload={(payload) => upload(payload)}
          loading={isPending}
        />
      </Card>
    </div>
  );
}
