import { Row, Col, Card, Tag, Typography, Button, Empty, Alert, List } from 'antd';
import { FileTextOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMyCVs } from '../../hooks/useCVs';
import { usePublicOffers } from '../../hooks/useOffers';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

dayjs.extend(relativeTime);
dayjs.locale('fr');

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: cvList, isLoading: loadingCv } = useMyCVs();
  const { data: offersData, isLoading: loadingOffers } = usePublicOffers({ limit: 5 });

  if (loadingCv) return <LoadingSpinner fullPage />;

  const myCv = cvList?.cvs?.[0] ?? null;

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        Bonjour, {user?.prenom || user?.email?.split('@')[0]} 👋
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Bienvenue dans votre espace candidat.
      </Typography.Text>

      {!myCv && (
        <Alert
          message="Profil incomplet"
          description="Créez votre CV pour apparaître dans les résultats de recherche des recruteurs."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button
              size="small"
              type="primary"
              onClick={() => navigate('/candidate/cv')}
            >
              Créer mon CV
            </Button>
          }
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <>
                <FileTextOutlined /> Mon CV
              </>
            }
            extra={
              <Button type="link" onClick={() => navigate('/candidate/cv')}>
                Voir
              </Button>
            }
          >
            {myCv ? (
              <div>
                <Tag
                  color={
                    myCv.statut === 'INDEXED'
                      ? 'success'
                      : myCv.statut === 'ERROR'
                      ? 'error'
                      : 'processing'
                  }
                >
                  {myCv.statut === 'INDEXED'
                    ? 'Indexé'
                    : myCv.statut === 'ERROR'
                    ? 'Erreur'
                    : "En cours d'analyse"}
                </Tag>
                <Typography.Text
                  style={{ display: 'block', marginTop: 8 }}
                  type="secondary"
                >
                  Déposé le {dayjs(myCv.date_depot).format('DD/MM/YYYY')}
                </Typography.Text>
              </div>
            ) : (
              <Empty
                description="Aucun CV"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  onClick={() => navigate('/candidate/cv')}
                >
                  Créer mon CV
                </Button>
              </Empty>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <>
                <SendOutlined /> Offres récentes
              </>
            }
            extra={
              <Button type="link" onClick={() => navigate('/')}>
                Toutes les offres
              </Button>
            }
            loading={loadingOffers}
          >
            {offersData?.offers.length ? (
              <List
                size="small"
                dataSource={offersData.offers}
                renderItem={(offer) => (
                  <List.Item
                    key={offer.id}
                    extra={
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        {dayjs(offer.date_publication).fromNow()}
                      </Typography.Text>
                    }
                  >
                    <Typography.Link
                      onClick={() => navigate(`/offers/${offer.id}`)}
                    >
                      {offer.titre}
                    </Typography.Link>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="Aucune offre disponible"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
