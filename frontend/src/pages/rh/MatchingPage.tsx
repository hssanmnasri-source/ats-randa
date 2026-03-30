import { useState } from 'react';
import { Select, Button, Card, Empty, Spin, Space, Alert, Typography, Tag, message } from 'antd';
import { AimOutlined, ReloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useRHOffers } from '../../hooks/useOffers';
import { useMatchResults, useRunMatching, useUpdateDecision } from '../../hooks/useMatching';
import MatchResultTable from '../../components/matching/MatchResultTable';
import PageHeader from '../../components/common/PageHeader';
import type { Decision } from '../../types/matching';
import { useAuthStore } from '../../store/authStore';

export default function MatchingPage() {
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const token = useAuthStore((s) => s.token);

  const { data: offersData, isLoading: loadingOffers } = useRHOffers({ limit: 100 });
  const { data: matchingData, isLoading: loadingResults, refetch } =
    useMatchResults(selectedOfferId, 100);
  const { mutate: runMatching, isPending: matching } = useRunMatching();
  const { mutate: updateDecision } = useUpdateDecision();

  const results = matchingData?.resultats ?? [];

  const handleDecision = (resultId: number, payload: { decision: Decision; feedback_rh?: string; feedback_visible?: boolean }) => {
    if (!selectedOfferId) return;
    setUpdatingId(resultId);
    updateDecision(
      { offerId: selectedOfferId, resultId, ...payload },
      { onSettled: () => setUpdatingId(null) }
    );
  };

  const handleRunMatching = () => {
    if (!selectedOfferId) return;
    runMatching(selectedOfferId);
  };

  const handleExportPdf = async () => {
    if (!selectedOfferId) return;
    setExportingPdf(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/rh/offers/${selectedOfferId}/export/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      a.download = match ? match[1] : `matching_${selectedOfferId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('Erreur lors de la génération du PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Matching IA"
        subtitle="Associez les meilleurs profils à vos offres"
      />

      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            placeholder="Sélectionnez une offre active"
            loading={loadingOffers}
            style={{ minWidth: 340 }}
            onChange={(v) => setSelectedOfferId(v)}
            value={selectedOfferId}
            options={(offersData?.offers ?? [])
              .filter((o) => o.statut === 'ACTIVE')
              .map((o) => ({ label: o.titre, value: o.id }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button
            type="primary"
            icon={<AimOutlined />}
            disabled={!selectedOfferId}
            loading={matching}
            onClick={handleRunMatching}
          >
            Lancer le matching
          </Button>
          {selectedOfferId && (
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Actualiser
            </Button>
          )}
          {selectedOfferId && results.length > 0 && (
            <Button
              icon={<FilePdfOutlined />}
              loading={exportingPdf}
              onClick={handleExportPdf}
              style={{ borderColor: '#8B1A1A', color: '#8B1A1A' }}
            >
              Exporter PDF
            </Button>
          )}
        </Space>
      </Card>

      {matching && (
        <Alert
          message="Matching en cours..."
          description="L'analyse IA est en cours. Les résultats apparaîtront dans quelques instants."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {selectedOfferId && matchingData && (
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Offre : <strong>{matchingData.titre}</strong> —{' '}
          <Tag color="blue">{matchingData.total} candidats analysés</Tag>
        </Typography.Text>
      )}

      {selectedOfferId ? (
        loadingResults ? (
          <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: 60 }} />
        ) : results.length > 0 ? (
          <MatchResultTable
            data={results}
            onDecision={handleDecision}
            updatingId={updatingId}
          />
        ) : (
          <Empty
            description="Aucun résultat. Lancez le matching pour analyser les CVs."
            style={{ padding: 60 }}
          />
        )
      ) : (
        <Empty
          description="Sélectionnez une offre pour voir les résultats."
          style={{ padding: 60 }}
        />
      )}
    </div>
  );
}
