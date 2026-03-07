import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameContext } from '../contexts/GameContext.jsx'
import { generateAvatar, getAvatarUrl, API_URL } from '../api/api'

const avatarEmojis = {
  Pedrochibus: '⚔️',
  Michel: '🎯',
  Gabi: '🎧',
  'Don Pablo': '🧛',
  'Don Anselmo': '🧙',
  'Don Alfonso': '📜',
  Manolo: '🍖',
  Jon: '🧠'
}

export default function CharacterCard({ name, score = 0, avatarFile = null }) {
  const navigate = useNavigate()
  const { setPlayer } = useGameContext()
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    loadAvatar()
  }, [name, avatarFile])

  async function loadAvatar() {
    setLoading(true)
    setImageError(false)

    try {
      const localUrl = getAvatarUrl(name, avatarFile)
      const img = new Image()

      img.onload = () => {
        setAvatarUrl(localUrl)
        setLoading(false)
      }

      img.onerror = async () => {
        const result = await generateAvatar(name)
        if (result && result.success) {
          setAvatarUrl(`${API_URL}${result.imageUrl}?t=${Date.now()}`)
          setImageError(false)
        } else {
          setImageError(true)
          setAvatarUrl(null)
        }
        setLoading(false)
      }

      img.src = localUrl
    } catch {
      setLoading(false)
      setImageError(true)
      setAvatarUrl(null)
    }
  }

  return (
    <motion.div
      className="character-card"
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        setPlayer(name)
        navigate(`/game/${name}`)
      }}
    >
      <div className="avatar-wrapper">
        <motion.div
          className="avatar-container"
          animate={{
            boxShadow: [
              '0 0 20px rgba(0, 212, 255, 0.2)',
              '0 0 40px rgba(0, 212, 255, 0.4)',
              '0 0 20px rgba(0, 212, 255, 0.2)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="avatar-img" style={{ backgroundColor: 'var(--dark-secondary)' }}>
            {avatarUrl && !imageError && (
              <img
                className="avatar-img"
                src={avatarUrl}
                alt={name}
                loading="eager"
                onError={() => {
                  setAvatarUrl(null)
                  setImageError(true)
                }}
              />
            )}
            {(loading || !avatarUrl || imageError) && (
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontSize: '3rem' }}
              >
                {avatarEmojis[name] || '🤖'}
              </motion.span>
            )}
          </div>
          <div className="avatar-scanner"></div>
        </motion.div>
      </div>

      <div className="card-info">
        <h3 className="character-name">{name}</h3>
        <div className="score-badge">
          <span className="label">SCORE</span>
          <span className="value">{score.toLocaleString()}</span>
        </div>
      </div>

      <button className="play-btn-premium">INICIAR MISIÓN</button>
      <div className="card-glitch-border"></div>
    </motion.div>
  )
}
