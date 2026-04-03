import { useState } from 'react';
import { Card, Select, Row, Col, Statistic, Segmented, Empty, Spin } from 'antd';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useRHOffers } from '../../hooks/useOffers';
import api from '../../services/api';
import { COLORS } from '../../theme';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';

const PIE_COLORS = [
  '#C9A84C','#8B1A1A','#1677ff','#52C41A','#722ED1',
  '#13C2C2','#FA8C16','#EB2F96','#3D0C02','#7CB305',
  '#08979C','#531DAB','#D4380D','#D46B08','#5B8C00',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SimplePieChart({ data, nameKey, title }: { data: any[]; nameKey: string; title: string }) {
  if (!data || data.length === 0) {
    return (
      <Card title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>{title}</span>}
        style={{ borderRadius: 12 }}>
        <Empty description="Pas de données" style={{ padding: 30 }} />
      </Card>
    );
  }
  return (
    <Card
      title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>{title}</span>}
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: '8px 0 16px' } }}
    >
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="45%"
            outerRadius={90} dataKey="count" nameKey={nameKey}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={(props: any) => {
              const { name, pct } = props;
              return pct > 3 ? `${name}: ${pct}%` : '';
            }}
            labelLine
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.map((_: any, i: number) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, _: any, props: any) => [
              `${value} (${props?.payload?.pct ?? 0}%)`,
              String(props?.payload?.[nameKey] ?? ''),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default function StatsPage() {
  const [selectedOffre, setSelectedOffre] = useState<number | null>(null);
  const [periode, setPeriode] = useState<number>(30);

  const { data: offresData } = useRHOffers({ limit: 100 });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['rh', 'stats', selectedOffre, periode],
    queryFn: async () => {
      if (!selectedOffre) return null;
      const res = await api.get(`/api/rh/offers/${selectedOffre}/stats?jours=${periode}`);
      return res.data;
    },
    enabled: !!selectedOffre,
    staleTime: 60_000,
  });

  return (
    <div>
      <PageHeader
        title="Statistiques des candidatures"
        subtitle="Analyse détaillée par offre — style Keejob"
      />

      {/* Sélecteurs */}
      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={14}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: COLORS.primary }}>Offre d'emploi</div>
            <Select
              placeholder="Choisir une offre..."
              style={{ width: '100%' }}
              value={selectedOffre}
              onChange={setSelectedOffre}
              showSearch
              filterOption={(input, opt) =>
                (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={(offresData?.offers || []).map((o) => ({
                value: o.id,
                label: o.titre,
              }))}
            />
          </Col>
          <Col xs={24} md={10}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: COLORS.primary }}>Période</div>
            <Segmented
              value={periode}
              onChange={(v) => setPeriode(v as number)}
              options={[
                { value: 7,  label: '7 jours' },
                { value: 30, label: '30 jours' },
                { value: 60, label: '60 jours' },
                { value: 90, label: '90 jours' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {!selectedOffre ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: 60 }}>
          <Empty description="Sélectionnez une offre pour voir ses statistiques" />
        </Card>
      ) : isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : (
        <>
          {/* KPIs */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {[
              { title: 'Total candidatures',  value: stats?.resume?.total_candidatures ?? 0, suffix: '',  color: COLORS.primary },
              { title: 'Candidats retenus',    value: stats?.resume?.retenus ?? 0,            suffix: '',  color: '#52C41A' },
              { title: 'Taux de rétention',    value: stats?.resume?.taux_retention ?? 0,     suffix: '%', color: COLORS.gold },
              { title: 'Score moyen matching', value: stats?.resume?.score_moyen ?? 0,        suffix: '%', color: '#722ED1' },
            ].map((kpi) => (
              <Col xs={12} md={6} key={kpi.title}>
                <Card
                  style={{ borderRadius: 12, borderTop: `3px solid ${kpi.color}`, textAlign: 'center' }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <Statistic
                    title={<span style={{ fontSize: 12, color: '#595959' }}>{kpi.title}</span>}
                    value={kpi.value}
                    suffix={kpi.suffix}
                    valueStyle={{ color: kpi.color, fontWeight: 800, fontSize: 26 }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* Courbe temporelle */}
          <Card
            title={
              <span style={{ color: COLORS.primary, fontWeight: 700 }}>
                Courbe de Vues et Candidatures en fonction du temps
              </span>
            }
            style={{ borderRadius: 12, marginBottom: 20 }}
          >
            {stats?.courbe && stats.courbe.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.courbe} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis
                    dataKey="date"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    tickFormatter={(d: any) => dayjs(d).format('DD. MMM.')}
                    tick={{ fontSize: 11, fill: '#8B8B8B' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#8B8B8B' }} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      value,
                      name === 'candidatures' ? 'Candidatures' : 'Vues',
                    ]}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    labelFormatter={(label: any) => dayjs(label).format('DD/MM/YYYY')}
                  />
                  <Legend
                    formatter={(value: string) => value === 'candidatures' ? 'Candidatures' : 'Vues'}
                    iconType="circle"
                  />
                  <Line type="monotone" dataKey="candidatures" stroke="#1677ff" strokeWidth={2}
                    dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="vues" stroke="#1A1A1A" strokeWidth={2}
                    dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Pas encore de données temporelles" />
            )}
          </Card>

          {/* Section candidats stats */}
          <Card
            title={<span style={{ color: COLORS.primary, fontWeight: 700 }}>Statistiques candidats</span>}
            style={{ borderRadius: 12 }}
          >
            {/* Régions */}
            <div style={{ marginBottom: 8, fontWeight: 700, textAlign: 'center', fontSize: 15 }}>
              Régions
            </div>
            {stats?.regions && stats.regions.length > 0 ? (
              <ResponsiveContainer width="100%" height={360}>
                <PieChart>
                  <Pie
                    data={stats.regions} cx="50%" cy="45%"
                    outerRadius={120} dataKey="count" nameKey="region"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={(props: any) => {
                      const { region, pct } = props;
                      return pct > 1.5 ? `${region}: ${pct}%` : '';
                    }}
                    labelLine
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(stats.regions as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any, _: any, p: any) => [
                      `${v} (${p?.payload?.pct ?? 0}%)`, p?.payload?.region ?? '',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Pas de données régionales" style={{ marginBottom: 20 }} />
            )}

            {/* Niveaux étude + expérience */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} md={12}>
                <SimplePieChart data={stats?.niveaux_etude || []} title="Niveaux d'étude" nameKey="niveau" />
              </Col>
              <Col xs={24} md={12}>
                <SimplePieChart data={stats?.niveaux_experience || []} title="Niveaux d'expérience" nameKey="niveau" />
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  );
}
