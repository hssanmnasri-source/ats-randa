import { useState, useMemo } from 'react';
import {
  Select, Table, Tag, Button, Space, Typography, Row, Col, Card, Empty, Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useRHOffers } from '../../hooks/useOffers';
import { useMatchResults, useUpdateDecision } from '../../hooks/useMatching';
import { COLORS } from '../../theme';
import type { ResultatOut, Decision } from '../../types/matching';

const { Text } = Typography;

const DECISION_CONFIG: Record<Decision, { label: string; color: string; icon: React.ReactNode }> = {
  RETAINED: { label: 'Retenu',    color: '#52C41A',      icon: <CheckCircleOutlined /> },
  PENDING:  { label: 'En attente', color: COLORS.gold,   icon: <ClockCircleOutlined /> },
  REFUSED:  { label: 'Refusé',    color: COLORS.primary, icon: <CloseCircleOutlined /> },
};

export default function CandidaturesPage() {
  const navigate = useNavigate();
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [filterDecision, setFilterDecision] = useState<Decision | 'ALL'>('ALL');

  const { data: offersData, isLoading: loadingOffers } = useRHOffers({ limit: 100 });
  const { data: resultsData, isLoading: loadingResults } = useMatchResults(selectedOfferId, 200);
  const { mutate: updateDecision, isPending: updatingDecision } = useUpdateDecision();

  const offerOptions = (offersData?.offers ?? []).map((o) => ({
    value: o.id,
    label: o.titre,
  }));

  const filteredResults = useMemo(() => {
    const rows = resultsData?.resultats ?? [];
    if (filterDecision === 'ALL') return rows;
    return rows.filter((r) => r.decision === filterDecision);
  }, [resultsData, filterDecision]);

  const handleDecisionChange = (record: ResultatOut, decision: Decision) => {
    if (!selectedOfferId) return;
    updateDecision({ offerId: selectedOfferId, resultId: record.id, decision });
  };

  const columns: ColumnsType<ResultatOut> = [
    {
      title: '#',
      dataIndex: 'rang',
      width: 50,
      render: (val: number) => (
        <Text style={{ color: COLORS.textMedium, fontSize: 12 }}>{val ?? '—'}</Text>
      ),
    },
    {
      title: 'Candidat',
      key: 'candidat',
      render: (_: unknown, record: ResultatOut) => (
        <Space>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: COLORS.primary, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14,
          }}>
            <UserOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: COLORS.textDark, fontSize: 13 }}>
              {record.candidat_prenom || ''} {record.candidat_nom || ''}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMedium }}>
              {record.candidat_email || '—'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Score final',
      dataIndex: 'score_final',
      width: 110,
      sorter: (a: ResultatOut, b: ResultatOut) => a.score_final - b.score_final,
      defaultSortOrder: 'descend',
      render: (val: number) => {
        const pct = Math.round(val * 100);
        const color = pct >= 70 ? '#52C41A' : pct >= 50 ? COLORS.gold : COLORS.primary;
        return (
          <Tag color={color} style={{ fontWeight: 700, fontSize: 13 }}>
            {pct}%
          </Tag>
        );
      },
    },
    {
      title: 'Sémantique',
      dataIndex: 'score_matching',
      width: 100,
      render: (val: number) => (
        <Text style={{ fontSize: 12, color: COLORS.textMedium }}>
          {Math.round(val * 100)}%
        </Text>
      ),
    },
    {
      title: 'Compétences',
      dataIndex: 'score_skills',
      width: 100,
      render: (val: number) => (
        <Text style={{ fontSize: 12, color: COLORS.textMedium }}>
          {Math.round(val * 100)}%
        </Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date_analyse',
      width: 110,
      render: (val: string) => (
        <Text style={{ fontSize: 12, color: COLORS.textMedium }}>
          {val ? new Date(val).toLocaleDateString('fr-FR') : '—'}
        </Text>
      ),
    },
    {
      title: 'Décision',
      dataIndex: 'decision',
      width: 160,
      render: (val: Decision, record: ResultatOut) => (
        <Select
          size="small"
          value={val}
          style={{ width: 150 }}
          disabled={updatingDecision}
          onChange={(newDecision: Decision) => handleDecisionChange(record, newDecision)}
          options={[
            { value: 'RETAINED', label: <span style={{ color: '#52C41A' }}>Retenu</span> },
            { value: 'PENDING',  label: <span style={{ color: COLORS.gold }}>En attente</span> },
            { value: 'REFUSED',  label: <span style={{ color: COLORS.primary }}>Refusé</span> },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      {/* Filtres */}
      <Card style={{ borderRadius: 12, marginBottom: 20 }} styles={{ body: { padding: '16px 20px' } }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={10}>
            <Text style={{ fontSize: 12, color: COLORS.textMedium, display: 'block', marginBottom: 6 }}>
              Offre
            </Text>
            <Select
              placeholder="Sélectionnez une offre..."
              options={offerOptions}
              style={{ width: '100%' }}
              loading={loadingOffers}
              onChange={(v: number) => setSelectedOfferId(v)}
              value={selectedOfferId}
              showSearch
              filterOption={(input, opt) =>
                (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={24} md={8}>
            <Text style={{ fontSize: 12, color: COLORS.textMedium, display: 'block', marginBottom: 6 }}>
              Décision
            </Text>
            <Select
              value={filterDecision}
              style={{ width: '100%' }}
              onChange={(v) => setFilterDecision(v)}
              options={[
                { value: 'ALL',      label: 'Toutes les décisions' },
                { value: 'PENDING',  label: 'En attente' },
                { value: 'RETAINED', label: 'Retenus' },
                { value: 'REFUSED',  label: 'Refusés' },
              ]}
            />
          </Col>
          <Col xs={24} md={6} style={{ display: 'flex', alignItems: 'flex-end', paddingTop: 22 }}>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={() => navigate('/rh/matching')}
              style={{ borderColor: '#722ED1', color: '#722ED1' }}
            >
              Lancer le matching
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Stats rapides */}
      {resultsData && selectedOfferId && (
        <Row gutter={12} style={{ marginBottom: 16 }}>
          {(Object.entries(DECISION_CONFIG) as [Decision, typeof DECISION_CONFIG[Decision]][]).map(([key, cfg]) => {
            const count = (resultsData.resultats ?? []).filter((r) => r.decision === key).length;
            return (
              <Col key={key}>
                <Tag
                  icon={cfg.icon}
                  color={cfg.color}
                  style={{
                    fontSize: 13,
                    padding: '4px 12px',
                    cursor: 'pointer',
                    fontWeight: filterDecision === key ? 700 : 400,
                  }}
                  onClick={() => setFilterDecision(filterDecision === key ? 'ALL' : key)}
                >
                  {cfg.label}: {count}
                </Tag>
              </Col>
            );
          })}
          <Col>
            <Tag style={{ fontSize: 13, padding: '4px 12px' }}>
              Total: {resultsData.resultats?.length ?? 0}
            </Tag>
          </Col>
        </Row>
      )}

      {/* Tableau */}
      {!selectedOfferId ? (
        <Empty
          description="Sélectionnez une offre pour voir les candidatures"
          style={{ padding: 60 }}
        />
      ) : loadingResults ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          dataSource={filteredResults}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (total) => `${total} candidats` }}
          size="middle"
          scroll={{ x: 800 }}
          locale={{ emptyText: <Empty description="Aucune candidature pour ce filtre" /> }}
        />
      )}
    </div>
  );
}
