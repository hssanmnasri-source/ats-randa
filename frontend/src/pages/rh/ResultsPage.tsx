import { useState } from 'react';
import {
  Select, Card, Empty, Spin, Row, Col, Statistic,
  Button, InputNumber, Badge, Progress,
  message, Drawer, Space,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  FilterOutlined, DownloadOutlined, ReloadOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRHOffers } from '../../hooks/useOffers';
import { useUpdateDecision } from '../../hooks/useMatching';
import MatchResultTable from '../../components/matching/MatchResultTable';
import PageHeader from '../../components/common/PageHeader';
import type { Decision, ResultatOut } from '../../types/matching';
import { COLORS } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const REGIONS_TUNISIE = [
  'Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba',
  'Kairouan','Kasserine','Kébili','Le Kef','Mahdia','La Manouba',
  'Médenine','Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana',
  'Sousse','Tataouine','Tozeur','Tunis','Zaghouan',
];

const NIVEAUX_ETUDE = [
  'Primaire','Secondaire','Formations professionnelles','Bac',
  'Bac + 1','Bac + 2','Bac + 3','Bac + 4','Bac + 5','Doctorat',
];

const NIVEAUX_EXPERIENCE = [
  'Aucune expérience',"Moins d'un an",'Entre 1 et 2 ans',
  'Entre 2 et 5 ans','Entre 5 et 10 ans','Plus que 10 ans',
];

export default function ResultsPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [topK, setTopK] = useState<number>(50);
  const [filterDecision, setFilterDecision] = useState<string | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ResultatOut | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [filters, setFilters] = useState<{
    score_min?: number;
    age_min?: number;
    age_max?: number;
    region?: string;
    niveau_etude?: string;
    niveau_experience?: string;
    disponibilite?: string;
    has_driving_license?: boolean;
  }>({});

  const { data: offersData } = useRHOffers({ limit: 100 });
  const { mutate: updateDecision } = useUpdateDecision();

  // ── Requête avec tous les filtres inclus dans les params URL ──────
  const { data: matchingData, isLoading } = useQuery({
    queryKey: ['rh', 'results', selectedOfferId, topK, filterDecision, filters],
    queryFn: async () => {
      if (!selectedOfferId) return null;
      const params = new URLSearchParams();
      params.append('top_k', String(topK));
      if (filterDecision)                    params.append('decision', filterDecision);
      if (filters.score_min != null)         params.append('score_min', String(filters.score_min));
      if (filters.age_min != null)           params.append('age_min', String(filters.age_min));
      if (filters.age_max != null)           params.append('age_max', String(filters.age_max));
      if (filters.region)                    params.append('region', filters.region);
      if (filters.niveau_etude)              params.append('niveau_etude', filters.niveau_etude);
      if (filters.niveau_experience)         params.append('niveau_experience', filters.niveau_experience);
      if (filters.disponibilite)             params.append('disponibilite', filters.disponibilite);
      if (filters.has_driving_license != null) {
        params.append('has_driving_license', String(filters.has_driving_license));
      }
      const res = await api.get(`/api/rh/offers/${selectedOfferId}/matching?${params}`);
      return res.data;
    },
    enabled: !!selectedOfferId,
    staleTime: 30_000,
  });

  const results = matchingData?.resultats ?? [];
  const retained = results.filter((r: ResultatOut) => r.decision === 'RETAINED').length;
  const refused  = results.filter((r: ResultatOut) => r.decision === 'REFUSED').length;
  const pending  = results.filter((r: ResultatOut) => r.decision === 'PENDING').length;

  const activeFiltersCount = Object.values(filters).filter((v) => v !== undefined).length
    + (filterDecision ? 1 : 0);

  const handleDecision = (resultId: number, payload: { decision: Decision; feedback_rh?: string; feedback_visible?: boolean }) => {
    if (!selectedOfferId) return;
    setUpdatingId(resultId);
    updateDecision(
      { offerId: selectedOfferId, resultId, ...payload },
      { onSettled: () => setUpdatingId(null) }
    );
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
      message.success('Export PDF lancé');
    } catch {
      message.error('Erreur lors de la génération du PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const getScoreColor = (s: number) =>
    s >= 0.7 ? '#52C41A' : s >= 0.5 ? COLORS.gold : s >= 0.3 ? '#FAAD14' : COLORS.primary;

  return (
    <div>
      <PageHeader
        title="Résultats & Décisions"
        subtitle="Consultez, filtrez et gérez les décisions par candidat"
        extra={
          <Button
            icon={<DownloadOutlined />}
            disabled={!selectedOfferId || results.length === 0}
            loading={exportingPdf}
            onClick={handleExportPdf}
            style={{ background: COLORS.gold, border: 'none', color: COLORS.darkBrown, fontWeight: 700, borderRadius: 8 }}
          >
            Exporter PDF
          </Button>
        }
      />

      {/* Sélecteurs principaux */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={9}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: COLORS.primary }}>Offre d'emploi</div>
            <Select
              placeholder="Sélectionnez une offre"
              style={{ width: '100%' }}
              onChange={(v) => setSelectedOfferId(v)}
              value={selectedOfferId}
              options={(offersData?.offers ?? []).map((o) => ({ label: o.titre, value: o.id }))}
              showSearch
              filterOption={(input, opt) =>
                (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={12} md={5}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: COLORS.primary }}>Nombre affiché</div>
            <Select
              value={topK}
              onChange={setTopK}
              style={{ width: '100%' }}
              options={[
                { value: 10,  label: 'Top 10' },
                { value: 20,  label: 'Top 20' },
                { value: 50,  label: 'Top 50' },
                { value: 100, label: 'Top 100' },
                { value: 200, label: 'Top 200' },
                { value: 500, label: 'Tous (max 500)' },
              ]}
            />
          </Col>
          <Col xs={12} md={5}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: COLORS.primary }}>Filtre décision</div>
            <Select
              value={filterDecision}
              onChange={setFilterDecision}
              allowClear
              style={{ width: '100%' }}
              placeholder="Toutes"
              options={[
                { value: 'PENDING',  label: '⏳ En attente' },
                { value: 'RETAINED', label: '✅ Retenus' },
                { value: 'REFUSED',  label: '❌ Refusés' },
              ]}
            />
          </Col>
          <Col xs={24} md={5}>
            <div style={{ marginBottom: 6, opacity: 0 }}>.</div>
            <Space>
              <Badge count={activeFiltersCount} size="small" color={COLORS.primary}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setShowFilters(!showFilters)}
                  style={{ borderColor: activeFiltersCount > 0 ? COLORS.primary : undefined, color: activeFiltersCount > 0 ? COLORS.primary : undefined }}
                >
                  Filtres
                </Button>
              </Badge>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => qc.invalidateQueries({ queryKey: ['rh', 'results'] })}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filtres avancés */}
      {showFilters && (
        <Card
          style={{ borderRadius: 12, marginBottom: 16, border: `1px solid ${COLORS.primary}30` }}
          title={
            <Row justify="space-between" align="middle">
              <Col><span style={{ color: COLORS.primary, fontWeight: 700 }}>Filtres avancés</span></Col>
              <Col>
                <Button size="small" onClick={() => setFilters({})}>Réinitialiser</Button>
              </Col>
            </Row>
          }
        >
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Âge</div>
              <Row gutter={8}>
                <Col span={12}>
                  <InputNumber placeholder="Min" min={18} max={80} value={filters.age_min} style={{ width: '100%' }}
                    onChange={(v) => setFilters((f) => ({ ...f, age_min: v ?? undefined }))} />
                </Col>
                <Col span={12}>
                  <InputNumber placeholder="Max" min={18} max={80} value={filters.age_max} style={{ width: '100%' }}
                    onChange={(v) => setFilters((f) => ({ ...f, age_max: v ?? undefined }))} />
                </Col>
              </Row>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Région</div>
              <Select placeholder="Tout le pays" allowClear style={{ width: '100%' }}
                value={filters.region} onChange={(v) => setFilters((f) => ({ ...f, region: v }))}
                showSearch options={REGIONS_TUNISIE.map((r) => ({ value: r, label: r }))} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Niveau d'étude</div>
              <Select placeholder="Tous" allowClear style={{ width: '100%' }}
                value={filters.niveau_etude} onChange={(v) => setFilters((f) => ({ ...f, niveau_etude: v }))}
                options={NIVEAUX_ETUDE.map((n) => ({ value: n, label: n }))} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Expérience</div>
              <Select placeholder="Tous" allowClear style={{ width: '100%' }}
                value={filters.niveau_experience} onChange={(v) => setFilters((f) => ({ ...f, niveau_experience: v }))}
                options={NIVEAUX_EXPERIENCE.map((n) => ({ value: n, label: n }))} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Score minimum</div>
              <Select placeholder="Pas de minimum" allowClear style={{ width: '100%' }}
                value={filters.score_min} onChange={(v) => setFilters((f) => ({ ...f, score_min: v }))}
                options={[
                  { value: 0.3, label: '30% et plus' },
                  { value: 0.5, label: '50% et plus' },
                  { value: 0.6, label: '60% et plus' },
                  { value: 0.7, label: '70% et plus' },
                  { value: 0.8, label: '80% et plus' },
                ]} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Disponibilité</div>
              <Select placeholder="Toutes" allowClear style={{ width: '100%' }}
                value={filters.disponibilite} onChange={(v) => setFilters((f) => ({ ...f, disponibilite: v }))}
                options={[
                  { value: 'Immédiate',    label: '✅ Immédiate' },
                  { value: 'Avec préavis', label: '📅 Avec préavis' },
                ]} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Permis de conduire</div>
              <Select placeholder="Tous" allowClear style={{ width: '100%' }}
                value={filters.has_driving_license}
                onChange={(v) => setFilters((f) => ({ ...f, has_driving_license: v }))}
                options={[
                  { value: true,  label: '✅ Avec permis' },
                  { value: false, label: '❌ Sans permis' },
                ]} />
            </Col>
          </Row>
        </Card>
      )}

      {/* Stats rapides */}
      {selectedOfferId && results.length > 0 && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {[
            { label: 'Total', value: results.length, color: COLORS.primary, icon: <TrophyOutlined /> },
            { label: 'Retenus',    value: retained, color: '#52C41A', icon: <CheckCircleOutlined /> },
            { label: 'Refusés',    value: refused,  color: COLORS.primary, icon: <CloseCircleOutlined /> },
            { label: 'En attente', value: pending,  color: COLORS.gold, icon: <ClockCircleOutlined /> },
          ].map((s) => (
            <Col xs={12} sm={6} key={s.label}>
              <Card style={{ borderRadius: 10, borderLeft: `3px solid ${s.color}`, textAlign: 'center' }}
                styles={{ body: { padding: '12px' } }}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>{s.label}</span>}
                  value={s.value}
                  valueStyle={{ color: s.color, fontWeight: 800, fontSize: 22 }}
                  prefix={s.icon}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Tableau résultats */}
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

      {/* Drawer détail candidat */}
      <Drawer
        title="Détail candidat"
        open={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        width={400}
      >
        {selectedResult && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div style={{
              textAlign: 'center', padding: 20,
              background: `${getScoreColor(selectedResult.score_final)}15`,
              borderRadius: 12, border: `2px solid ${getScoreColor(selectedResult.score_final)}`,
            }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: getScoreColor(selectedResult.score_final) }}>
                {Math.round(selectedResult.score_final * 100)}%
              </div>
              <div style={{ color: '#595959' }}>Score global</div>
            </div>
            {[
              { label: 'Sémantique',  value: selectedResult.score_matching },
              { label: 'Compétences', value: selectedResult.score_skills },
              { label: 'Expérience',  value: selectedResult.score_experience },
              { label: 'Langue',      value: selectedResult.score_langue ?? 0 },
            ].map((item) => (
              <div key={item.label}>
                <Row justify="space-between">
                  <Col style={{ fontSize: 13 }}>{item.label}</Col>
                  <Col style={{ fontWeight: 700, color: getScoreColor(item.value) }}>
                    {Math.round(item.value * 100)}%
                  </Col>
                </Row>
                <Progress
                  percent={Math.round(item.value * 100)}
                  strokeColor={getScoreColor(item.value)}
                  showInfo={false} size="small"
                />
              </div>
            ))}
          </Space>
        )}
      </Drawer>
    </div>
  );
}
