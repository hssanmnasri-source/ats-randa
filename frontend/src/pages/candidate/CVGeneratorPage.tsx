import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button, Skeleton, Alert, Typography, Space } from 'antd';
import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useFullProfile } from '../../hooks/useCandidate';
import CVDocument from '../../components/cv/CVDocument';
import { COLORS } from '../../theme';

const { Title, Text } = Typography;

export default function CVGeneratorPage() {
  const { data, isLoading, isError } = useFullProfile();
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: data
      ? `CV_${data.profile.prenom ?? ''}_${data.profile.nom ?? ''}`.replace(/\s+/g, '_')
      : 'Mon_CV',
  });

  if (isLoading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Skeleton active paragraph={{ rows: 20 }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert
        type="error"
        message="Impossible de charger votre profil"
        description="Veuillez vérifier votre connexion et réessayer."
        showIcon
      />
    );
  }

  const { profile, experiences, skills, langues, formations } = data;
  const isEmpty =
    !profile.nom &&
    !profile.prenom &&
    !experiences.length &&
    !skills.length &&
    !formations.length;

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <Space align="center" style={{ marginBottom: 4 }}>
            <FilePdfOutlined style={{ fontSize: 22, color: COLORS.primary }} />
            <Title level={4} style={{ margin: 0 }}>Générateur de CV</Title>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Prévisualisation de votre CV au format Keejob — téléchargeable en PDF.
          </Text>
        </div>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          size="large"
          onClick={() => handlePrint()}
          disabled={isEmpty}
          style={{ background: COLORS.primary, borderColor: COLORS.primary }}
        >
          Télécharger mon CV (PDF)
        </Button>
      </div>

      {isEmpty && (
        <Alert
          type="warning"
          showIcon
          message="Profil incomplet"
          description="Complétez votre profil (informations personnelles, expériences, compétences) pour générer un CV."
          style={{ marginBottom: 20 }}
        />
      )}

      {/* ── CV Preview ─────────────────────────────────────────── */}
      <div style={{
        boxShadow: '0 4px 24px rgba(139,26,26,0.12)',
        border: '1px solid #E8D5B0',
        borderRadius: 4,
        overflow: 'hidden',
        background: '#FAFAFA',
        padding: '0 0 1px',
      }}>
        <CVDocument
          ref={contentRef}
          profile={profile}
          experiences={experiences}
          skills={skills}
          langues={langues}
          formations={formations}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Le PDF sera généré au format A4. Assurez-vous que les couleurs sont activées dans les options d'impression.
        </Text>
      </div>
    </div>
  );
}
