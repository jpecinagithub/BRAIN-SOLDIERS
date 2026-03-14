import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  assignPlayerTeam,
  createPlayer,
  createTeam,
  deletePlayer,
  deleteTeam,
  getGameMode,
  getPlayers,
  getTeams,
  resetScores,
  setGameMode
} from '../api/api'

export default function AdminPage() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [playerName, setPlayerName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [updatingPlayerId, setUpdatingPlayerId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [gameMode, setGameModeState] = useState('individual')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [playersData, teamsData] = await Promise.all([getPlayers(), getTeams()])
      setPlayers(Array.isArray(playersData) ? playersData : [])
      setTeams(Array.isArray(teamsData) ? teamsData : [])
      const modeData = await getGameMode()
      setGameModeState(modeData?.mode === 'teams' ? 'teams' : 'individual')
    } catch {
      setError('No se pudieron cargar la configuración, jugadores y equipos.')
    }
  }

  async function handleCreatePlayer(e) {
    e.preventDefault()
    const trimmed = playerName.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')
    setMessage('')
    try {
      await createPlayer(trimmed)
      setPlayerName('')
      setMessage('Jugador creado correctamente.')
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo crear el jugador.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(playerId, playerName) {
    const ok = window.confirm(`Eliminar a "${playerName}"?`)
    if (!ok) return

    setLoading(true)
    setError('')
    setMessage('')
    try {
      await deletePlayer(playerId)
      setMessage('Jugador eliminado correctamente.')
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el jugador.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault()
    const trimmed = teamName.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')
    setMessage('')
    try {
      await createTeam(trimmed)
      setTeamName('')
      setMessage('Equipo creado correctamente.')
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo crear el equipo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteTeam(teamId, teamLabel) {
    const ok = window.confirm(`Eliminar el equipo "${teamLabel}"? Los jugadores quedarán sin equipo.`)
    if (!ok) return

    setLoading(true)
    setError('')
    setMessage('')
    try {
      await deleteTeam(teamId)
      setMessage('Equipo eliminado correctamente.')
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el equipo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignTeam(playerId, teamIdValue) {
    setUpdatingPlayerId(playerId)
    setError('')
    setMessage('')
    try {
      const normalizedTeamId = teamIdValue === '' ? null : Number(teamIdValue)
      await assignPlayerTeam(playerId, normalizedTeamId)
      setMessage('Equipo actualizado.')
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el equipo del jugador.')
    } finally {
      setUpdatingPlayerId(null)
    }
  }

  async function handleModeChange(nextMode) {
    if (nextMode !== 'individual' && nextMode !== 'teams') return
    if (nextMode === gameMode) return

    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await setGameMode(nextMode)
      setGameModeState(response.mode === 'teams' ? 'teams' : 'individual')
      setMessage(`Modo de clasificación actualizado a: ${nextMode === 'teams' ? 'equipos' : 'individual'}.`)
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el modo de juego.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetScores() {
    const ok = window.confirm('¿Reiniciar todas las puntuaciones a 0?')
    if (!ok) return

    setLoading(true)
    setError('')
    setMessage('')
    try {
      await resetScores()
      setMessage('Puntuaciones reiniciadas a 0.')
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudieron reiniciar las puntuaciones.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="math-game admin-page">
      <div className="admin-topbar">
        <motion.button
          className="back-btn"
          onClick={() => navigate('/')}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Volver
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-title"
        >
          <h2>Panel de administración</h2>
          <p>Gestiona jugadores, equipos y formato de clasificación.</p>
        </motion.div>
      </div>

      <div className="admin-shell">
        <section className="admin-card admin-settings">
          <h3>Modo de clasificación</h3>
          <div className="admin-mode-switch" role="group" aria-label="Modo de clasificación">
            <button
              type="button"
              className={`admin-mode-btn ${gameMode === 'individual' ? 'active' : ''}`}
              onClick={() => handleModeChange('individual')}
              disabled={loading}
            >
              Individual
            </button>
            <button
              type="button"
              className={`admin-mode-btn ${gameMode === 'teams' ? 'active' : ''}`}
              onClick={() => handleModeChange('teams')}
              disabled={loading}
            >
              Equipos
            </button>
          </div>
          <div className="admin-reset-row">
            <div>
              <p className="admin-reset-title">Reiniciar puntuaciones</p>
              <p className="admin-reset-desc">Pone todas las puntuaciones en 0.</p>
            </div>
            <button
              type="button"
              className="option-btn incorrect admin-danger-btn admin-reset-btn"
              onClick={handleResetScores}
              disabled={loading || players.length === 0}
            >
              Reiniciar
            </button>
          </div>
        </section>

        {message && <div className="message success admin-msg">{message}</div>}
        {error && <div className="message error admin-msg">{error}</div>}

        <div className="admin-columns">
          <div className="admin-column">
            <section className="admin-card admin-create-card">
              <h3>Nuevo equipo</h3>
              <form onSubmit={handleCreateTeam} className="admin-form">
                <input
                  className="math-input admin-input"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Nombre del equipo"
                  disabled={loading}
                />
                <button className="math-btn" type="submit" disabled={loading || !teamName.trim()}>
                  Añadir
                </button>
              </form>
            </section>

            <section className="admin-card admin-panel">
              <div className="admin-panel-header">
                <h3>Equipos</h3>
                <span>{teams.length}</span>
              </div>
              <div className="admin-list">
                {teams.length === 0 && <div className="admin-empty">No hay equipos creados.</div>}
                {teams.map((team) => (
                  <div key={team.id} className="admin-row">
                    <strong>{team.name}</strong>
                    <button
                      className="option-btn incorrect admin-danger-btn"
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      disabled={loading}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="admin-column">
            <section className="admin-card admin-create-card">
              <h3>Nuevo jugador</h3>
              <form onSubmit={handleCreatePlayer} className="admin-form">
                <input
                  className="math-input admin-input"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Nombre del jugador"
                  disabled={loading}
                />
                <button className="math-btn" type="submit" disabled={loading || !playerName.trim()}>
                  Añadir
                </button>
              </form>
            </section>

          <section className="admin-card admin-panel">
            <div className="admin-panel-header">
              <h3>Jugadores</h3>
              <span>{players.length}</span>
            </div>
            <div className="admin-list admin-list--players">
              <div className="admin-players-head">
                <span>#</span>
                <span>Nombre</span>
                <span>Puntos</span>
                <span>Equipo</span>
                <span>Acción</span>
              </div>
              {players.length === 0 && <div className="admin-empty">No hay jugadores creados.</div>}
              {players.map((player, index) => (
                <div key={player.id} className="admin-row admin-player-row">
                  <span className="admin-index">{index + 1}</span>
                  <strong>{player.name}</strong>
                  <span className="admin-points">{player.score}</span>
                  <select
                    className={`math-input admin-select ${player.team_id === null || player.team_id === undefined ? 'admin-select--unassigned' : ''}`}
                    value={player.team_id ?? ''}
                    onChange={(e) => handleAssignTeam(player.id, e.target.value)}
                    disabled={updatingPlayerId === player.id}
                  >
                    <option value="">Sin equipo</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                  <button
                    className="option-btn incorrect admin-danger-btn"
                    onClick={() => handleDelete(player.id, player.name)}
                      disabled={loading}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
