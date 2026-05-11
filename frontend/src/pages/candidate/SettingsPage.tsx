import { useState } from 'react';
import {
  Card, Form, Radio, Select, Button, Input, Modal, Divider, Space,
  Typography, Row, Col, Alert, App,
} from 'antd';
import {
  EyeOutlined, LockOutlined, MailOutlined, DeleteOutlined, BellOutlined,
} from '@ant-design/icons';
import { useFullProfile, useUpdateVisibility } from '../../hooks/useCandidate';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

export default function SettingsPage() {
  const { message } = App.useApp();
  const { data, isLoading, isError } = useFullProfile();
  const { mutate: updateVisibility, isPending: savingVisibility } = useUpdateVisibility();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const [visibilityForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [deleteModal, setDeleteModal] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (isError || !data) return (
    <Alert
      type="error"
      showIcon
      message="Impossible de charger les paramètres. Réessayez dans quelques instants."
      style={{ margin: 24 }}
    />
  );

  const profile = data.profile;

  const handleVisibilitySave = () => {
    visibilityForm.validateFields().then((values) => {
      updateVisibility(values);
    });
  };

  const handleEmailSave = async () => {
    const values = await emailForm.validateFields();
    setSavingEmail(true);
    try {
      await api.put('/api/candidate/profile', { email: values.email });
      message.success('Email mis à jour.');
      emailForm.resetFields(['password_confirm']);
    } catch {
      message.error('Erreur lors du changement d\'email.');
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePwdSave = async () => {
    const values = await pwdForm.validateFields();
    if (values.new_password !== values.confirm_password) {
      message.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setSavingPwd(true);
    try {
      await api.post('/api/candidate/change-password', {
        current_password: values.current_password,
        new_password: values.new_password,
      });
      message.success('Mot de passe mis à jour.');
      pwdForm.resetFields();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      message.error(axiosErr?.response?.data?.detail ?? 'Erreur lors du changement de mot de passe.');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/api/candidate/account');
      logout();
      navigate('/');
    } catch {
      message.error('Erreur lors de la suppression du compte.');
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 4 }}>Paramètres du compte</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Gérez la visibilité de votre profil, vos alertes et la sécurité de votre compte.
      </Text>

      <Row gutter={[24, 24]}>
        {/* Profile visibility */}
        <Col xs={24} lg={12}>
          <Card
            title={<Space><EyeOutlined style={{ color: '#8B1A1A' }} /><span>Visibilité du profil</span></Space>}
          >
            <Form
              form={visibilityForm}
              layout="vertical"
              initialValues={{
                visibility_status: profile.visibility_status ?? 'VISIBLE',
                alert_frequency:   profile.alert_frequency   ?? 'WEEKLY',
              }}
            >
              <Form.Item name="visibility_status" label="Qui peut voir votre profil ?">
                <Radio.Group>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Radio value="VISIBLE">
                      <Text strong>Visible</Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        Les recruteurs peuvent voir votre profil complet
                      </Text>
                    </Radio>
                    <Radio value="ANONYMOUS">
                      <Text strong>Visible anonyme</Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        Nom et informations de contact masqués
                      </Text>
                    </Radio>
                    <Radio value="INVISIBLE">
                      <Text strong>Invisible</Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        Profil non visible par les recruteurs
                      </Text>
                    </Radio>
                  </div>
                </Radio.Group>
              </Form.Item>

              <Divider />

              <Form.Item
                name="alert_frequency"
                label={<Space><BellOutlined />Fréquence des alertes email</Space>}
              >
                <Select
                  options={[
                    { value: 'DAILY',      label: 'Quotidienne' },
                    { value: 'TWICE_WEEK', label: '2 fois par semaine' },
                    { value: 'WEEKLY',     label: 'Hebdomadaire' },
                    { value: 'NEVER',      label: 'Jamais' },
                  ]}
                />
              </Form.Item>

              <Button
                type="primary"
                onClick={handleVisibilitySave}
                loading={savingVisibility}
                style={{ background: '#8B1A1A', borderColor: '#8B1A1A' }}
              >
                Enregistrer
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Email & Password */}
        <Col xs={24} lg={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Change email */}
            <Card title={<Space><MailOutlined style={{ color: '#8B1A1A' }} /><span>Changer l'adresse email</span></Space>}>
              <Form form={emailForm} layout="vertical">
                <Form.Item
                  name="email"
                  label="Nouvelle adresse email"
                  initialValue={profile.email ?? ''}
                  rules={[{ required: true, type: 'email' }]}
                >
                  <Input />
                </Form.Item>
                <Button
                  onClick={handleEmailSave}
                  loading={savingEmail}
                  style={{ borderColor: '#8B1A1A', color: '#8B1A1A' }}
                >
                  Mettre à jour l'email
                </Button>
              </Form>
            </Card>

            {/* Change password */}
            <Card title={<Space><LockOutlined style={{ color: '#8B1A1A' }} /><span>Changer le mot de passe</span></Space>}>
              <Form form={pwdForm} layout="vertical">
                <Form.Item name="current_password" label="Mot de passe actuel" rules={[{ required: true }]}>
                  <Input.Password />
                </Form.Item>
                <Form.Item
                  name="new_password"
                  label="Nouveau mot de passe"
                  rules={[{ required: true, min: 8, message: 'Minimum 8 caractères' }]}
                >
                  <Input.Password />
                </Form.Item>
                <Form.Item
                  name="confirm_password"
                  label="Confirmer le nouveau mot de passe"
                  rules={[{ required: true }]}
                >
                  <Input.Password />
                </Form.Item>
                <Button
                  onClick={handlePwdSave}
                  loading={savingPwd}
                  style={{ borderColor: '#8B1A1A', color: '#8B1A1A' }}
                >
                  Changer le mot de passe
                </Button>
              </Form>
            </Card>
          </div>
        </Col>

        {/* Danger zone */}
        <Col xs={24}>
          <Card
            title={<Space><DeleteOutlined style={{ color: '#FF4D4F' }} /><span style={{ color: '#FF4D4F' }}>Zone de danger</span></Space>}
            style={{ borderColor: '#FF4D4F' }}
          >
            <Alert
              title="Suppression définitive du compte"
              description="Cette action est irréversible. Toutes vos données (profil, CV, candidatures, lettres de motivation) seront définitivement supprimées."
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Button danger onClick={() => setDeleteModal(true)}>
              Supprimer mon compte
            </Button>
          </Card>
        </Col>
      </Row>

      <Modal
        title={<span style={{ color: '#FF4D4F' }}>Confirmer la suppression du compte</span>}
        open={deleteModal}
        onOk={handleDeleteAccount}
        onCancel={() => setDeleteModal(false)}
        okText="Oui, supprimer définitivement"
        cancelText="Annuler"
        okButtonProps={{ danger: true }}
      >
        <Paragraph>
          Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est <Text strong>irréversible</Text>.
        </Paragraph>
        <Paragraph type="secondary">
          Toutes vos données personnelles, CVs, candidatures et lettres de motivation seront supprimées.
        </Paragraph>
      </Modal>
    </div>
  );
}
