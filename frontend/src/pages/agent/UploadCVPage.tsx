import { Card, Typography } from 'antd';
import CVUploadForm from '../../components/cv/CVUploadForm';
import PageHeader from '../../components/common/PageHeader';
import { useAgentUploadCV } from '../../hooks/useCVs';

export default function UploadCVPage() {
  const { mutate: upload, isPending, isSuccess } = useAgentUploadCV();

  return (
    <div>
      <PageHeader
        title="Upload de CV"
        subtitle="Enregistrez un CV physique pour un candidat"
      />
      <Card style={{ maxWidth: 760 }}>
        {!isSuccess && (
          <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
            Renseignez les informations du candidat puis joignez le fichier CV.
            Notre IA analysera automatiquement le contenu (PDF, DOCX, JPG, PNG — max 10MB).
          </Typography.Paragraph>
        )}
        <CVUploadForm
          onUpload={(payload) => upload(payload)}
          loading={isPending}
          onSuccess={isSuccess}
        />
      </Card>
    </div>
  );
}
