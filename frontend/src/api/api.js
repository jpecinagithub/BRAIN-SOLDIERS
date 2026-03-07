const runtimeDefaultApiUrl =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://localhost:3001'

export const API_URL = import.meta.env.VITE_API_URL || runtimeDefaultApiUrl

const avatarByPlayer = {
  Pedrochibus: 'avatar1.png',
  Michel: 'avatar2.png',
  Gabi: 'avatar3.png',
  'Don Pablo': 'avatar4.png',
  'Don Anselmo': 'avatar5.png',
  'Don Alfonso': 'avatar6.png',
  Manolo: 'avatar7.png',
  Jon: 'avatar8.png'
}

export function getAvatarUrl(playerName, avatarFile) {
  if (avatarFile) {
    return `${API_URL}/avatars/${avatarFile}`
  }

  const fileName = avatarByPlayer[playerName]
  if (fileName) {
    return `${API_URL}/avatars/${fileName}`
  }

  const slug = playerName.toLowerCase().replace(/\s+/g, '-')
  return `${API_URL}/avatars/${slug}.png`
}

export async function getRanking() {
  const res = await fetch(`${API_URL}/ranking`)
  return res.json()
}

export async function getGameMode() {
  const res = await fetch(`${API_URL}/settings/game-mode`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'No se pudo obtener el modo de juego')
  }
  return res.json()
}

export async function setGameMode(mode) {
  const res = await fetch(`${API_URL}/settings/game-mode`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'No se pudo actualizar el modo de juego')
  }
  return res.json()
}

export async function getPlayers() {
  const res = await fetch(`${API_URL}/players`)
  return res.json()
}

export async function createPlayer(name) {
  const res = await fetch(`${API_URL}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'No se pudo crear el jugador')
  }
  return res.json()
}

export async function deletePlayer(id) {
  const res = await fetch(`${API_URL}/players/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'No se pudo eliminar el jugador')
  }
  return res.json()
}

export async function submitScore(player, points, game) {
  const res = await fetch(`${API_URL}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player, points, game })
  })
  return res.json()
}

export async function generateAvatar(playerName) {
  return {
    success: false,
    imageUrl: getAvatarUrl(playerName)
  }
}

export async function getTeams() {
  const res = await fetch(`${API_URL}/teams`)
  return res.json()
}

export async function createTeam(name) {
  const res = await fetch(`${API_URL}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'No se pudo crear el equipo')
  }
  return res.json()
}

export async function deleteTeam(id) {
  const res = await fetch(`${API_URL}/teams/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'No se pudo eliminar el equipo')
  }
  return res.json()
}

export async function assignPlayerTeam(playerId, teamId) {
  const res = await fetch(`${API_URL}/players/${playerId}/team`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId })
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'No se pudo asignar el equipo')
  }
  return res.json()
}
