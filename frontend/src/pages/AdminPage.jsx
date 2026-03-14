import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  assignPlayerTeam,
  createPlayer,
  createTeam,
  deletePlayer,
  deleteTeam,
  getGameStatuses,
  getGameMode,
  getPlayers,
  getTeams,
  resetScores,
  setGameStatus,
  setGameMode
} from '../api/api'
import { gamesCatalog } from '../data/games'

export default function AdminPage() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [playerName, setPlayerName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [updatingPlayerId, setUpdatingPlayerId] = useState(null)
  const [updatingGameId, setUpdatingGameId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [gameMode, setGameModeState] = useState('individual')
  const [gameStatuses, setGameStatuses] = useState({})
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    onConfirm: null
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [playersData, teamsData, gameStatusData, modeData] = await Promise.all([
        getPlayers(),
        getTeams(),
        getGameStatuses(),
        getGameMode()
      ])
      setPlayers(Array.isArray(playersData) ? playersData : [])
      setTeams(Array.isArray(teamsData) ? teamsData : [])
      setGameModeState(modeData?.mode === 'teams' ? 'teams' : 'individual')
      setGameStatuses(gameStatusData?.games || {})
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

  async function runDeletePlayer(playerId, playerName) {
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

  function handleDelete(playerId, playerName) {
    openConfirm({
      title: 'Eliminar jugador',
      message: `¿Eliminar a "${playerName}"?`,
      confirmLabel: 'Eliminar',
      onConfirm: () => runDeletePlayer(playerId, playerName)
    })
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

  async function runDeleteTeam(teamId, teamLabel) {
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

  function handleDeleteTeam(teamId, teamLabel) {
    openConfirm({
      title: 'Eliminar equipo',
      message: `¿Eliminar el equipo "${teamLabel}"? Los jugadores quedarán sin equipo.`,
      confirmLabel: 'Eliminar',
      onConfirm: () => runDeleteTeam(teamId, teamLabel)
    })
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

  function openConfirm({ title, message, confirmLabel, onConfirm }) {
    setConfirmState({
      open: true,
      title,
      message,
      confirmLabel: confirmLabel || 'Confirmar',
      onConfirm
    })
  }

  function closeConfirm() {
    setConfirmState({
      open: false,
      title: '',
      message: '',
      confirmLabel: '',
      onConfirm: null
    })
  }

  async function handleConfirmAction() {
    const action = confirmState.onConfirm
    if (!action) {
      closeConfirm()
      return
    }

    try {
      await action()
    } finally {
      closeConfirm()
    }
  }

  function handleResetScores() {
    setShowResetConfirm(true)
  }

  async function handleConfirmResetScores() {
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
      setShowResetConfirm(false)
    }
  }

  async function handleGameStatusChange(gameId, nextActive, gameLabel) {
    setUpdatingGameId(gameId)
    setError('')
    setMessage('')
    try {
      const response = await setGameStatus(gameId, nextActive)
      setGameStatuses((prev) => ({
        ...prev,
        [gameId]: response.active
      }))
      setMessage(`Juego ${gameLabel} actualizado a ${response.active ? 'activo' : 'no activo'}.`)
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del juego.')
    } finally {
      setUpdatingGameId(null)
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

        <section className="admin-card admin-games">
          <div className="admin-panel-header">
            <h3>Estado de juegos</h3>
            <span>{gamesCatalog.length}</span>
          </div>
          <div className="admin-games-list">
            {gamesCatalog.map((game) => {
              const isActive = gameStatuses[game.id] !== false
              return (
                <div key={game.id} className="admin-row admin-game-row" style={{ '--game-color': game.color }}>
                  <div className="admin-game-name">
                    <span className="admin-game-dot" />
                    <div>
                      <strong>{game.name}</strong>
                      <small>{game.description}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`admin-toggle ${isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleGameStatusChange(game.id, !isActive, game.name)}
                    disabled={loading || updatingGameId === game.id}
                  >
                    {isActive ? 'Activo' : 'No activo'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

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

      {showResetConfirm && (
        <div className="game-over" role="dialog" aria-modal="true" aria-label="Confirmar reinicio">
          <div className="game-over-content">
            <h2>Reiniciar puntuaciones</h2>
            <p>¿Seguro que quieres poner todas las puntuaciones en 0?</p>
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={handleConfirmResetScores}
                disabled={loading}
                type="button"
              >
                Sí, reiniciar
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowResetConfirm(false)}
                disabled={loading}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState.open && (
        <div className="game-over" role="dialog" aria-modal="true" aria-label={confirmState.title}>
          <div className="game-over-content">
            <h2>{confirmState.title}</h2>
            <p>{confirmState.message}</p>
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={handleConfirmAction}
                disabled={loading}
                type="button"
              >
                {confirmState.confirmLabel}
              </button>
              <button
                className="btn-secondary"
                onClick={closeConfirm}
                disabled={loading}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
