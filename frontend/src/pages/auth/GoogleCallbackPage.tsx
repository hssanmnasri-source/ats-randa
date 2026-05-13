import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from '@/store/authStore'

const GoogleCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const params = searchParams
    const access_token = params.get('access_token')
    const role = params.get('role')
    const nom = params.get('nom')
    const prenom = params.get('prenom')
    const email = params.get('email')
    const avatar = params.get('avatar')

    if (access_token && role) {
      try {
        const parts = access_token.split('.')
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(base64))
        login(access_token, {
          id: parseInt(payload.sub),
          nom: nom || '',
          prenom: prenom || '',
          email: email || '',
          role: role as any,
          is_active: true,
          avatar_url: avatar || undefined,
        })
        const redirectMap: Record<string, string> = {
          ADMIN: '/admin',
          RH: '/rh',
          AGENT: '/agent',
          CANDIDATE: '/candidate',
        }
        navigate(redirectMap[role] || '/')
      } catch (e) {
        navigate('/login?error=google_failed')
      }
    } else {
      const debug = encodeURIComponent(window.location.href)
      navigate(`/login?error=google_failed&debug=${debug}`)
    }
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: 16,
    }}>
      <Spin size="large" />
      <div style={{ color: '#595959' }}>Connexion avec Google en cours...</div>
    </div>
  )
}

export default GoogleCallbackPage
