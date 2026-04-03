import { useState, useEffect } from 'react';
import {
  Select, Button, Card, Empty, Spin, Space, Alert,
  Typography, Tag, message, Slider, InputNumber,
  Row, Col, Popover, Badge,
} from 'antd';
import { AimOutlined, ReloadOutlined, FilePdfOutlined, SettingOutlined } from '@ant-design/icons';
import { useRHOffers } from '../../hooks/useOffers';
import { useMatchResults, useRunMatching, useUpdateDecision } from '../../hooks/useMatching';
import MatchResultTable from '../../components/matching/MatchResultTable';
import PageHeader from '../../components/common/PageHeader';
import type { Decision } from '../../types/matching';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { COLORS } from '../../theme';

export default function MatchingPage() {
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const token = useAuthStore((s) => s.token);

  // Poids scoring
  const [poids, setPoids] = useState({ semantique: 40, competences: 35, experience: 15, langue: 10 });
  const [poidsModifies, setPoidsModifies] = useState(false);
  const [savingPoids, setSavingPoids] = useState(false);

  const { data: offersData, isLoading: loadingOffers } = useRHOffers({ limit: 100 });
  const { data: matchingData, isLoading: loadingResults, refetch } =
    useMatchResults(selectedOfferId, 100);
  const { mutate: runMatching, isPending: matching } = useRunMatching();
  const { mutate: updateDecision } = useUpdateDecision();

  const results = matchingData?.resultats ?? [];

  // Charger poids de l'offre sélectionnée
  useEffect(() => {
    if (selectedOfferId && offersData?.offers) {
      const offer = offersData.offers.find((o) => o.id === selectedOfferId);
      if (offer) {
        setPoids({
          semantique:  Math.round((offer.poids_semantique  ?? 0.40) * 100),
          competences: Math.round((offer.poids_competences ?? 0.35) * 100),
          experience:  Math.round((offer.poids_experience  ?? 0.15) * 100),
          langue:      Math.round((offer.poids_langue      ?? 0.10) * 100),
        });
        setPoidsModifies(false);
      }
    }
  }, [selectedOfferId, offersData]);

  const totalPoids = Object.values(poids).reduce((a, b) => a + b, 0);
  const poidsValides = Math.abs(totalPoids - 100) <= 1;

  const updatePoids = (key: string, value: number | null) => {
    setPoids((prev) => ({ ...prev, [key]: value ?? 0 }));
    setPoidsModifies(true);
  };

  const savePoids = async () => {
    if (!selectedOfferId || !poidsValides) return;
    setSavingPoids(true);
    try {
      await api.put(`/api/rh/offers/${selectedOfferId}/poids`, {
        poids_semantique:  poids.semantique  / 100,
        poids_competences: poids.competences / 100,
        poids_experience:  poids.experience  / 100,
        poids_langue:      poids.langue      / 100,
      });
      message.success('Poids sauvegardés — relancez le matching pour recalculer');
      setPoidsModifies(false);
    } catch {
      message.error('Erreur lors de la sauvegarde des poids');
    } finally {
      setSavingPoids(false);
    }
  };

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

  const poidsItems = [
    { key: 'semantique',  label: 'Sémantique (pgvector)', color: '#722ED1' },
    { key: 'competences', label: 'Compétences (Jaccard)',  color: '#1677ff' },
    { key: 'experience',  label: 'Expérience (années)',    color: COLORS.gold },
    { key: 'langue',      label: 'Langue',                 color: '#52C41A' },
  ];

  const poidsContent = (
    <div style={{ width: 360, padding: 4 }}>
      <Alert
        type={poidsValides ? 'success' : 'error'}
        message={
          <span>
            Total : <strong style={{ fontSize: 15 }}>{totalPoids}%</strong>
            {!poidsValides && ' — doit être 100%'}
          </span>
        }
        showIcon
        style={{ marginBottom: 14, borderRadius: 8 }}
      />
      {poidsItems.map((item) => (
        <div key={item.key} style={{ marginBottom: 14 }}>
          <Row align="middle" justify="space-between" style={{ marginBottom: 4 }}>
            <Col>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</span>
            </Col>
            <Col>
              <InputNumber
                min={0} max={100}
                value={(poids as any)[item.key]}
                onChange={(v) => updatePoids(item.key, v)}
                size="small"
                style={{ width: 72 }}
                addonAfter="%"
              />
            </Col>
          </Row>
          <Slider
            min={0} max={100}
            value={(poids as any)[item.key]}
            onChange={(v) => updatePoids(item.key, v)}
            styles={{ track: { background: item.color }, handle: { borderColor: item.color } }}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
        </div>
      ))}
      <Button
        block type="primary"
        loading={savingPoids}
        disabled={!poidsValides || !poidsModifies}
        onClick={savePoids}
        style={{ background: poidsValides ? COLORS.primary : undefined, border: 'none', borderRadius: 8, fontWeight: 700 }}
      >
        Sauvegarder les poids
      </Button>
      <div style={{ marginTop: 10, fontSize: 11, color: '#8B8B8B', textAlign: 'center' }}>
        Appliqués au prochain matching
      </div>
    </div>
  );

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
              .filter((o) => ['ACTIVE', 'PROCHAINEMENT', 'EN_VALIDATION'].includes(o.statut))
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
              style={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              Exporter PDF
            </Button>
          )}

          {/* Bouton poids scoring */}
          <Popover
            content={poidsContent}
            title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>Personnaliser les poids du scoring</span>}
            trigger="click"
            placement="bottomRight"
          >
            <Badge dot={poidsModifies} offset={[-4, 4]}>
              <Button
                icon={<SettingOutlined />}
                disabled={!selectedOfferId}
                style={{ borderColor: COLORS.gold, color: COLORS.gold }}
              >
                Poids scoring
              </Button>
            </Badge>
          </Popover>
        </Space>

        {/* Affichage poids actifs */}
        {selectedOfferId && (
          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {poidsItems.map((item) => (
              <Tag key={item.key} color={item.color} style={{ fontWeight: 700 }}>
                {(poids as any)[item.key]}%
              </Tag>
            ))}
            <span style={{ fontSize: 11, color: '#8B8B8B', alignSelf: 'center' }}>
              poids actuels
            </span>
          </div>
        )}
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
