import { useRef, useEffect } from 'react'
import {
  motion, useInView, useMotionValue, useTransform,
  animate, type Variants,
} from 'framer-motion'
import {
  UploadCloud, Brain, CheckCircle2, Users, FileSearch,
  CalendarCheck, ShieldCheck, Zap, BarChart3,
} from 'lucide-react'
import { COLORS } from '@/theme'

// ── helpers ──────────────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

function stagger(i: number): Variants {
  return {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1, y: 0,
      transition: { delay: i * 0.13, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 48 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: COLORS.primary, margin: '0 0 8px' }}>
        {title}
      </h2>
      <p style={{ color: '#777', fontSize: 15, margin: 0 }}>{subtitle}</p>
    </div>
  )
}

function GradientDivider({ color }: { color: string }) {
  return (
    <div style={{
      height: 2,
      background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
      margin: '0 40px',
    }} />
  )
}

// ── Section 1 — How it works ──────────────────────────────────────────────────

const STEPS = [
  {
    icon: <UploadCloud size={30} />,
    title: 'Déposez votre CV',
    desc: 'Upload en PDF, DOCX ou image. Notre moteur OCR (Tesseract, FR/AR/EN) extrait les données même sur les documents scannés.',
    color: '#1677ff',
  },
  {
    icon: <Brain size={30} />,
    title: 'Analyse par IA',
    desc: 'Le pipeline NLP parse compétences, expériences et formations. Un embedding 384-dim capture le sens profond de votre profil.',
    color: COLORS.primary,
  },
  {
    icon: <CheckCircle2 size={30} />,
    title: 'Matching & Décision',
    desc: 'Correspondance sémantique multi-critères avec les offres actives. Le RH reçoit un classement précis et prend sa décision.',
    color: '#52C41A',
  },
]

function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} style={{ padding: '64px 0' }}>
      <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
        <SectionTitle title="Comment ça marche" subtitle="Du CV au classement en quelques secondes, 100 % automatisé" />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            variants={stagger(i)}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            whileHover={{ y: -6, transition: { duration: 0.22 } }}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
              border: '1.5px solid #f0f0f0',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'default',
            }}
          >
            {/* faint step number */}
            <div style={{
              position: 'absolute', top: 12, right: 18,
              fontSize: 56, fontWeight: 900,
              color: step.color, opacity: 0.07,
              lineHeight: 1, userSelect: 'none',
            }}>
              {i + 1}
            </div>

            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: `${step.color}14`, color: step.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              {step.icon}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>
              {step.title}
            </h3>
            <p style={{ fontSize: 13.5, color: '#666', margin: 0, lineHeight: 1.65 }}>
              {step.desc}
            </p>

            {/* bottom accent bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.5, ease: 'easeOut' }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${step.color}, ${step.color}00)`,
                transformOrigin: 'left',
              }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── Section 2 — Features ──────────────────────────────────────────────────────

const FEATURES = [
  { icon: <FileSearch size={20} />, title: 'Parsing NLP intelligent',   desc: 'Extraction automatique de compétences, expériences et formations depuis tout type de CV.', color: '#1677ff' },
  { icon: <Zap size={20} />,        title: 'Matching sémantique',       desc: 'Pgvector + scoring multi-critères (40% sémantique, 35% compétences, 15% exp., 10% langue).', color: COLORS.primary },
  { icon: <Users size={20} />,      title: 'Système multi-rôles',       desc: 'Candidat, Agent, RH et Admin — chaque rôle dispose de son espace dédié et ses droits.', color: '#722ED1' },
  { icon: <CalendarCheck size={20} />, title: 'Entretiens automatisés', desc: 'Génération de créneaux, envoi d\'invitations et suivi des confirmations via n8n.', color: '#52C41A' },
  { icon: <ShieldCheck size={20} />,   title: 'Décisions immuables',    desc: 'RETENU/REFUSÉ sont définitifs — aucun recalcul ne peut écraser une décision RH.', color: '#FA8C16' },
  { icon: <BarChart3 size={20} />,     title: 'Statistiques RH',        desc: 'Tableaux de bord analytiques par offre, par période et par profil de candidat.', color: COLORS.gold },
]

function Features() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} style={{
      padding: '64px 32px',
      background: `linear-gradient(135deg, ${COLORS.darkBrown}08, ${COLORS.primary}06)`,
      borderRadius: 24,
      margin: '0 -8px',
    }}>
      <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
        <SectionTitle
          title="Fonctionnalités clés"
          subtitle="Une plateforme complète pensée pour les équipes RH et les candidats"
        />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            variants={stagger(i)}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '18px 20px',
              border: '1.5px solid #f0f0f0',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              cursor: 'default',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: `${f.color}14`, color: f.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 12.5, color: '#888', lineHeight: 1.6 }}>
                {f.desc}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── Section 3 — Stats ─────────────────────────────────────────────────────────

function AnimatedNumber({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString('fr-FR'))

  useEffect(() => {
    if (inView) {
      animate(count, to, { duration: 1.8, ease: 'easeOut' })
    }
  }, [inView, to, count])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

const STATS = [
  { value: 4131, suffix: '+', label: 'CVs analysés',         color: '#1677ff'     },
  { value: 50,   suffix: '',  label: 'Top candidats/offre',  color: COLORS.primary },
  { value: 384,  suffix: '',  label: 'Dimensions embedding', color: '#722ED1'     },
  { value: 99,   suffix: '%', label: 'Décisions préservées', color: '#52C41A'     },
]

function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} style={{ padding: '64px 0' }}>
      <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
        <SectionTitle title="ATS RANDA en chiffres" subtitle="Des performances mesurables au service du recrutement" />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
        {STATS.map((s, i) => (
          <motion.div
            key={i}
            variants={stagger(i)}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '28px 20px',
              textAlign: 'center',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              border: `2px solid ${s.color}20`,
              cursor: 'default',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 180 }}
              style={{
                fontSize: 38, fontWeight: 900,
                color: s.color, lineHeight: 1, marginBottom: 8,
                letterSpacing: '-1px',
              }}
            >
              <AnimatedNumber to={s.value} />{s.suffix}
            </motion.div>
            <div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function ProjectSections() {
  return (
    <div style={{ marginBottom: 48 }}>
      <HowItWorks />
      <GradientDivider color={COLORS.gold} />
      <Features />
      <GradientDivider color={COLORS.primary} />
      <Stats />
      <GradientDivider color={COLORS.gold} />
    </div>
  )
}
