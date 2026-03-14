import { API_URL } from '../api/api'

export const gamesCatalog = [
  { id: 'simon', name: 'Misión Simon', icon: `${API_URL}/games/simon.svg`, description: 'Reconocimiento de Patrones', color: '#ff6b35' },
  { id: 'puzzle', name: 'Misión Puzzle', icon: `${API_URL}/games/puzzle.svg`, description: 'Reconstrucción de Imagen', color: '#bc13fe' },
  { id: 'memory', name: 'Misión Memoria', icon: `${API_URL}/games/memory.svg`, description: 'Fortalecimiento Neural', color: '#00ff88' },
  { id: 'math', name: 'Misión Cálculo', icon: `${API_URL}/games/math.svg`, description: 'Velocidad Computacional', color: '#ff4757' },
  { id: 'stroop', name: 'Stroop Express', icon: `${API_URL}/games/stroop.svg`, description: 'Control Inhibitorio', color: '#00d4ff' },
  { id: 'sequence', name: 'Secuencia Lógica', icon: `${API_URL}/games/sequence.svg`, description: 'Patrones y series', color: '#f7c331' },
  { id: 'path', name: 'Camino Fantasma', icon: `${API_URL}/games/path.svg`, description: 'Memoria visuoespacial', color: '#6c5ce7' },
  { id: 'search', name: 'Búsqueda Visual', icon: `${API_URL}/games/search.svg`, description: 'Agilidad visual', color: '#ff9f43' },
  { id: 'rotation', name: 'Rotación Rápida', icon: `${API_URL}/games/rotation.svg`, description: 'Rotación mental', color: '#1dd1a1' },
  { id: 'compare', name: 'Comparación Relámpago', icon: `${API_URL}/games/compare.svg`, description: 'Decisión rápida', color: '#ff6b81' },
  { id: 'rule', name: 'Parejas con Regla', icon: `${API_URL}/games/rule.svg`, description: 'Atención y criterio', color: '#48dbfb' },
  { id: 'echo', name: 'Eco Numérico', icon: `${API_URL}/games/echo.svg`, description: 'Memoria de trabajo', color: '#54a0ff' }
]
