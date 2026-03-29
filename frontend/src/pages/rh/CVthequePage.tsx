import { useState } from 'react';
import { Input, Button, Card, Row, Col, Tag, Progress, Avatar, Empty, Spin, Typography } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useCVSearch } from '../../hooks/useRHDashboard';
import { COLORS } from '../../theme';
import type { CVSearchResult } from '../../types/rh';

const { Text } = Typography;

const SOURCE_COLORS: Record<string, string> = {
  KEEJOB:   '#1677ff',
  AGENT:    COLORS.gold,
  CANDIDAT: '#52C41A',
};

const SOURCE_LABELS: Record<string, string> = {
  KEEJOB:   'Keejob',
  AGENT:    'Agent',
  CANDIDAT: 'Candidat',
};

function CVCard({ cv }: { cv: CVSearchResult }) {
  const scoreColor =
    cv.score >= 0.7 ? '#52C41A' : cv.score >= 0.5 ? COLORS.gold : COLORS.primary;
  const nom = `${cv.prenom || ''} ${cv.nom || ''}`.trim() || `CV #${cv.cv_id}`;

  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 12,
        borderLeft: `4px solid ${scoreColor}`,
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <Row align="middle" gutter={16} wrap={false}>
        <Col>
          <Avatar size={48} icon={<UserOutlined />} style={{ background: COLORS.primary }} />
        </Col>
        <Col flex="1" style={{ minWidth: 0 }}>
          <Row align="middle" gutter={8}>
            <Col>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A' }}>{nom}</span>
            </Col>
            <Col>
              <Tag
                color={SOURCE_COLORS[cv.source]}
                style={{ fontSize: 10, fontWeight: 600, borderRadius: 20, margin: 0 }}
              >
                {SOURCE_LABELS[cv.source]}
              </Tag>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 6 }}>
            {cv.email && (
              <Col>
                <Text style={{ fontSize: 12, color: '#595959' }}>
                  <MailOutlined style={{ marginRight: 4 }} />
                  {cv.email}
                </Text>
              </Col>
            )}
            {cv.telephone && (
              <Col>
                <Text style={{ fontSize: 12, color: '#595959' }}>
                  <PhoneOutlined style={{ marginRight: 4 }} />
                  {cv.telephone}
                </Text>
              </Col>
            )}
          </Row>
          {cv.extrait && (
            <Text
              style={{
                fontSize: 13,
                color: '#595959',
                marginTop: 8,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              } as React.CSSProperties}
            >
              {cv.extrait}
            </Text>
          )}
        </Col>
        <Col style={{ textAlign: 'center', minWidth: 100 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: scoreColor }}>
            {Math.round(cv.score * 100)}%
          </div>
          <Progress
            percent={Math.round(cv.score * 100)}
            strokeColor={scoreColor}
            showInfo={false}
            size="small"
          />
          <div style={{ fontSize: 11, color: '#8B8B8B', marginTop: 2 }}>Compatibilité</div>
        </Col>
      </Row>
    </Card>
  );
}

export default function CVthequePage() {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading } = useCVSearch(query);

  const handleSearch = () => {
    if (inputValue.trim().length >= 2) setQuery(inputValue.trim());
  };

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkBrown}, ${COLORS.primary})`,
        borderRadius: 16,
        padding: '28px 36px',
        marginBottom: 24,
      }}>
        <Row align="middle" gutter={16}>
          <Col>
            <DatabaseOutlined style={{ fontSize: 40, color: COLORS.gold }} />
          </Col>
          <Col>
            <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>CVthèque IA</div>
            <div style={{ color: COLORS.goldLight, fontSize: 14 }}>
              Recherche sémantique dans +4 000 CVs indexés
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 20, maxWidth: 700 }}>
          <Input.Search
            size="large"
            placeholder='Ex: "développeur React 3 ans", "électromécanique maintenance", "commercial Tunis"...'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            enterButton={
              <Button
                icon={<SearchOutlined />}
                style={{ background: COLORS.gold, border: 'none', color: COLORS.darkBrown, fontWeight: 700 }}
              >
                Recherche IA
              </Button>
            }
          />
          <div style={{ color: COLORS.goldLight, fontSize: 12, marginTop: 8 }}>
            La recherche comprend le sens, pas juste les mots-clés exacts
          </div>
        </div>
      </div>

      {/* État vide — avant toute recherche */}
      {!query && (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: 48 }}>
          <DatabaseOutlined style={{ fontSize: 48, color: '#D9D9D9' }} />
          <div style={{ color: '#8B8B8B', marginTop: 16, fontSize: 15 }}>
            Entrez un profil ou des compétences pour rechercher dans la CVthèque
          </div>
          <div style={{ color: '#BFBFBF', fontSize: 13, marginTop: 8 }}>
            La recherche IA trouve les CVs sémantiquement proches, même sans mots-clés exacts
          </div>
        </Card>
      )}

      {/* Chargement */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#595959' }}>Analyse sémantique en cours...</div>
        </div>
      )}

      {/* Résultats */}
      {data && !isLoading && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Tag color={COLORS.primary} style={{ fontSize: 13, padding: '4px 12px' }}>
              {data.total} CV{data.total > 1 ? 's' : ''} trouvé{data.total > 1 ? 's' : ''} pour «{data.query}»
            </Tag>
          </div>
          {data.results.length === 0 ? (
            <Empty description="Aucun CV trouvé pour cette recherche" />
          ) : (
            data.results.map((cv) => <CVCard key={cv.cv_id} cv={cv} />)
          )}
        </>
      )}
    </div>
  );
}
