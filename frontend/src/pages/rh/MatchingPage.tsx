import { useState } from 'react';
import { Select, Button, Card, Empty, Spin, Space, Alert, Typography, Tag } from 'antd';
import { AimOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRHOffers } from '../../hooks/useOffers';
import { useMatchResults, useRunMatching, useUpdateDecision } from '../../hooks/useMatching';
import MatchResultTable from '../../components/matching/MatchResultTable';
import PageHeader from '../../components/common/PageHeader';
import type { Decision } from '../../types/matching';

export default function MatchingPage() {
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: offersData, isLoading: loadingOffers } = useRHOffers({ limit: 100 });
  const { data: matchingData, isLoading: loadingResults, refetch } =
    useMatchResults(selectedOfferId, 100);
  const { mutate: runMatching, isPending: matching } = useRunMatching();
  const { mutate: updateDecision } = useUpdateDecision();

  const results = matchingData?.resultats ?? [];

  const handleDecision = (resultId: number, decision: Decision) => {
    if (!selectedOfferId) return;
    setUpdatingId(resultId);
    updateDecision(
      { offerId: selectedOfferId, resultId, decision },
      { onSettled: () => setUpdatingId(null) }
    );
  };

  const handleRunMatching = () => {
    if (!selectedOfferId) return;
    runMatching(selectedOfferId, {
      onSuccess: () => setTimeout(() => refetch(), 2000),
    });
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
