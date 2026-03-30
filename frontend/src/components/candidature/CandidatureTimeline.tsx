import React from 'react'
import { Steps, Card, Progress, Alert, Row, Col } from 'antd'
import {
  SendOutlined, RobotOutlined, EyeOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import type { CandidatureDetail, TimelineStep } from '@/types/candidature'
import { COLORS } from '@/theme'
import dayjs from 'dayjs'

const STEP_ICONS: Record<string, React.ReactNode> = {
  POSTULE:   <SendOutlined />,
  ANALYSE:   <RobotOutlined />,
  EN_EXAMEN: <EyeOutlined />,
  DECISION:  <CheckCircleOutlined />,
}

const CandidatureTimeline: React.FC<{ candidature: CandidatureDetail }> = ({ candidature }) => {
  const { timeline, decision, score_final } = candidature

  const currentStep = timeline.findIndex((s: TimelineStep) => s.active)
  const displayStep = decision === 'RETAINED' || decision === 'REFUSED'
    ? timeline.length - 1
    : currentStep >= 0 ? currentStep : 0

  const scoreColor = score_final >= 0.7 ? '#52C41A'
    : score_final >= 0.4 ? COLORS.gold : COLORS.primary

  return (
    <div>
      {/* Score compatibilité */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 20,
          border: `2px solid ${scoreColor}30`,
          background: `${scoreColor}08`,
        }}
      >
        <Row align="middle" gutter={20}>
          <Col>
            <div style={{ fontSize: 42, fontWeight: 900, color: scoreColor }}>
              {Math.round(score_final * 100)}%
            </div>
            <div style={{ fontSize: 13, color: '#595959' }}>
              Compatibilité IA
            </div>
          </Col>
          <Col flex="1">
            <Row gutter={[8, 8]}>
              {[
                { label: '🧠 Sémantique', value: candidature.score_matching, poids: '40%' },
                { label: '🎯 Compétences', value: candidature.score_skills, poids: '35%' },
                { label: '📅 Expérience', value: candidature.score_experience, poids: '15%' },
                { label: '🌐 Langue', value: candidature.score_langue, poids: '10%' },
              ].map((item) => (
                <Col span={12} key={item.label}>
                  <div style={{ fontSize: 11, color: '#595959', marginBottom: 2 }}>
                    {item.label}
                    <span style={{ color: COLORS.gold, marginLeft: 4 }}>{item.poids}</span>
                  </div>
                  <Progress
                    percent={Math.round(item.value * 100)}
                    size="small"
                    strokeColor={
                      item.value >= 0.6 ? '#52C41A'
                      : item.value >= 0.3 ? COLORS.gold
                      : COLORS.primary
                    }
                    showInfo
                    format={(p) => `${p}%`}
                  />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Timeline */}
      <Card
        title={
          <span style={{ color: COLORS.primary, fontWeight: 700 }}>
            📦 Suivi de votre candidature
          </span>
        }
        style={{ borderRadius: 12, marginBottom: 20 }}
      >
        <Steps
          current={displayStep}
          direction="vertical"
          items={timeline.map((step: TimelineStep) => ({
            title: (
              <span style={{ fontWeight: 600, fontSize: 15 }}>
                {step.label}
              </span>
            ),
            description: (
              <div>
                <div style={{ color: '#595959', fontSize: 13 }}>
                  {step.description}
                </div>
                {step.date && (
                  <div style={{ color: '#8B8B8B', fontSize: 11, marginTop: 4 }}>
                    {dayjs(step.date).format('DD/MM/YYYY à HH:mm')}
                  </div>
                )}
              </div>
            ),
            icon: step.done
              ? (step.statut === 'DECISION' && decision === 'REFUSED'
                ? <CloseCircleOutlined style={{ color: '#FF4D4F' }} />
                : <CheckCircleOutlined style={{ color: step.color }} />)
              : step.active
              ? STEP_ICONS[step.statut]
              : <ClockCircleOutlined style={{ color: '#D9D9D9' }} />,
            status: (step.done ? 'finish' : step.active ? 'process' : 'wait') as 'finish' | 'process' | 'wait',
          }))}
        />
      </Card>

      {/* Feedback RH */}
      {candidature.feedback_rh && candidature.feedback_visible && (
        <Alert
          type={decision === 'RETAINED' ? 'success' : 'info'}
          showIcon
          message={
            <span style={{ fontWeight: 700 }}>
              💬 Message de l'équipe RH
            </span>
          }
          description={
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
              {candidature.feedback_rh}
            </div>
          }
          style={{ borderRadius: 10 }}
        />
      )}

      {!candidature.feedback_rh && decision === 'REFUSED' && (
        <Alert
          type="info"
          showIcon
          message="Aucun retour personnalisé disponible pour cette candidature."
          description="Continuez à postuler à d'autres offres RANDA qui correspondent à votre profil."
          style={{ borderRadius: 10 }}
        />
      )}
    </div>
  )
}

export default CandidatureTimeline
