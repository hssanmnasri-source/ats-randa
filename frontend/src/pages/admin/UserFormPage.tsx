import { Form, Input, Select, Button, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCreateUser } from '../../hooks/useAdmin';
import type { UserCreateIn } from '../../types/api';
import PageHeader from '../../components/common/PageHeader';

interface FormValues extends UserCreateIn {
  confirm_password: string;
}

export default function UserFormPage() {
  const navigate = useNavigate();
  const { mutate: create, isPending } = useCreateUser();
  const [form] = Form.useForm<FormValues>();

  const onFinish = ({ confirm_password: _, ...values }: FormValues) => {
    create(values, { onSuccess: () => navigate('/admin/users') });
  };

  return (
    <div>
      <PageHeader
        title="Créer un utilisateur"
        breadcrumbs={[
          { title: 'Utilisateurs', href: '/admin/users' },
          { title: 'Nouveau' },
        ]}
      />
      <Card style={{ maxWidth: 480 }}>
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark="optional"
        >
          <Form.Item
            name="prenom"
            label="Prénom"
            rules={[{ required: true, message: 'Obligatoire.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="nom"
            label="Nom"
            rules={[{ required: true, message: 'Obligatoire.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Obligatoire.' },
              { type: 'email', message: 'Format invalide.' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Rôle"
            rules={[{ required: true, message: 'Sélectionnez un rôle.' }]}
          >
            <Select
              options={['ADMIN', 'RH', 'AGENT', 'CANDIDATE'].map((r) => ({
                label: r,
                value: r,
              }))}
            />
          </Form.Item>
          <Form.Item name="departement" label="Département">
            <Input placeholder="Ex : Informatique" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[
              { required: true, message: 'Obligatoire.' },
              { min: 8, message: 'Minimum 8 caractères.' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="Confirmer le mot de passe"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Obligatoire.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value)
                    return Promise.resolve();
                  return Promise.reject(
                    new Error('Les mots de passe ne correspondent pas.')
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending}
              style={{ marginRight: 8 }}
            >
              Créer
            </Button>
            <Button onClick={() => navigate('/admin/users')}>Annuler</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
