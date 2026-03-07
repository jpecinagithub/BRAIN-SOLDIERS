import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import GameHub from './pages/GameHub'
import AdminPage from './pages/AdminPage'
import SimonGame from './games/SimonGame'
import PuzzleGame from './games/PuzzleGame'
import MemoryGame from './games/MemoryGame'
import MathGame from './games/MathGame'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/game/:player" element={<GameHub />} />
          <Route path="/game/:player/simon" element={<SimonGame />} />
          <Route path="/game/:player/puzzle" element={<PuzzleGame />} />
          <Route path="/game/:player/memory" element={<MemoryGame />} />
          <Route path="/game/:player/math" element={<MathGame />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
