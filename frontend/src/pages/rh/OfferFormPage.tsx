import { Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateOffer, useUpdateOffer, useRHOffer } from '../../hooks/useOffers';
import OfferForm from '../../components/offer/OfferForm';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { CreateOfferRequest } from '../../types/offer';

export default function OfferFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existingOffer, isLoading } = useRHOffer(Number(id));
  const { mutate: create, isPending: creating } = useCreateOffer();
  const { mutate: update, isPending: updating } = useUpdateOffer();

  const handleSubmit = (values: CreateOfferRequest) => {
    if (isEdit) {
      update(
        { id: Number(id), data: values },
        { onSuccess: () => navigate('/rh/offers') }
      );
    } else {
      create(values, { onSuccess: () => navigate('/rh/offers') });
    }
  };

  if (isEdit && isLoading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Modifier l'offre" : 'Nouvelle offre'}
        breadcrumbs={[
          { title: 'Offres', href: '/rh/offers' },
          { title: isEdit ? 'Modifier' : 'Nouvelle' },
        ]}
      />
      <Card style={{ maxWidth: 720 }}>
        <OfferForm
          initialValues={
            existingOffer
              ? {
                  titre: existingOffer.titre,
                  description: existingOffer.description,
                  competences_requises: existingOffer.competences_requises,
                  experience_requise: existingOffer.experience_requise,
                  langue_requise: existingOffer.langue_requise,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          loading={creating || updating}
          onCancel={() => navigate('/rh/offers')}
        />
      </Card>
    </div>
  );
}
