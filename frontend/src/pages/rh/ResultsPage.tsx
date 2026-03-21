import { useState } from 'react';
import { Select, Card, Empty, Spin, Row, Col, Statistic, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useRHOffers } from '../../hooks/useOffers';
import { useMatchResults, useUpdateDecision } from '../../hooks/useMatching';
import MatchResultTable from '../../components/matching/MatchResultTable';
import PageHeader from '../../components/common/PageHeader';
import type { Decision } from '../../types/matching';
import { COLORS } from '../../theme';

export default function ResultsPage() {
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: offersData } = useRHOffers({ limit: 100 });
  const { data: matchingData, isLoading } = useMatchResults(selectedOfferId, 200);
  const { mutate: updateDecision } = useUpdateDecision();

  const results = matchingData?.resultats ?? [];
  const retained = results.filter((r) => r.decision === 'RETAINED').length;
  const refused = results.filter((r) => r.decision === 'REFUSED').length;
  const pending = results.filter((r) => r.decision === 'PENDING').length;

  const handleDecision = (resultId: number, decision: Decision) => {
    if (!selectedOfferId) return;
    setUpdatingId(resultId);
    updateDecision(
      { offerId: selectedOfferId, resultId, decision },
      { onSettled: () => setUpdatingId(null) }
    );
  };

  return (
    <div>
      <PageHeader
        title="Résultats de matching"
        subtitle="Consultez et gérez les décisions par candidat"
      />

      <Card style={{ marginBottom: 24 }}>
        <Select
          placeholder="Sélectionnez une offre"
          style={{ minWidth: 360 }}
          onChange={(v) => setSelectedOfferId(v)}
          value={selectedOfferId}
          options={(offersData?.offers ?? []).map((o) => ({
            label: o.titre,
            value: o.id,
          }))}
          showSearch
        />
        {matchingData && (
          <Tag color="blue" style={{ marginLeft: 12 }}>
            {matchingData.total} candidats
          </Tag>
        )}
      </Card>

      {selectedOfferId && results.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Retenus"
                value={retained}
                valueStyle={{ color: COLORS.secondary }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="En attente"
                value={pending}
                valueStyle={{ color: COLORS.warning }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Refusés"
                value={refused}
                valueStyle={{ color: COLORS.danger }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {selectedOfferId ? (
        isLoading ? (
          <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: 60 }} />
        ) : results.length > 0 ? (
          <MatchResultTable
            data={results}
            onDecision={handleDecision}
            updatingId={updatingId}
          />
        ) : (
          <Empty description="Aucun résultat pour cette offre." style={{ padding: 60 }} />
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
