import { Form, Input, Button, Card, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '../../services/candidateService';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CandidateProfilePage() {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['candidate', 'profile'],
    queryFn: () => candidateService.getProfile(),
  });

  const { mutate: update, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof candidateService.updateProfile>[0]) =>
      candidateService.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', 'profile'] });
      message.success('Profil mis à jour.');
    },
    onError: () => message.error('Erreur lors de la mise à jour.'),
  });

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <PageHeader title="Mon profil" />
      <Card style={{ maxWidth: 560 }}>
        <Form
          layout="vertical"
          initialValues={profile ?? {}}
          onFinish={update}
          requiredMark="optional"
        >
          <Form.Item name="prenom" label="Prénom">
            <Input />
          </Form.Item>
          <Form.Item name="nom" label="Nom">
            <Input />
          </Form.Item>
          <Form.Item name="telephone" label="Téléphone">
            <Input placeholder="+216 XX XXX XXX" />
          </Form.Item>
          <Form.Item name="adresse" label="Adresse">
            <Input placeholder="Ville, Pays" />
          </Form.Item>
          <Form.Item name="date_naissance" label="Date de naissance">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isPending}>
              Enregistrer
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
