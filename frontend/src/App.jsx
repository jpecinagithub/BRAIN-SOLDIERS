import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import GameHub from './pages/GameHub'
import AdminPage from './pages/AdminPage'
import SimonGame from './games/SimonGame'
import PuzzleGame from './games/PuzzleGame'
import MemoryGame from './games/MemoryGame'
import MathGame from './games/MathGame'
import StroopGame from './games/StroopGame'
import SequenceLogicGame from './games/SequenceLogicGame'
import PathMemoryGame from './games/PathMemoryGame'
import VisualSearchGame from './games/VisualSearchGame'
import RotationGame from './games/RotationGame'
import QuickCompareGame from './games/QuickCompareGame'
import RuleMatchGame from './games/RuleMatchGame'
import NumberEchoGame from './games/NumberEchoGame'

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
          <Route path="/game/:player/stroop" element={<StroopGame />} />
          <Route path="/game/:player/sequence" element={<SequenceLogicGame />} />
          <Route path="/game/:player/path" element={<PathMemoryGame />} />
          <Route path="/game/:player/search" element={<VisualSearchGame />} />
          <Route path="/game/:player/rotation" element={<RotationGame />} />
          <Route path="/game/:player/compare" element={<QuickCompareGame />} />
          <Route path="/game/:player/rule" element={<RuleMatchGame />} />
          <Route path="/game/:player/echo" element={<NumberEchoGame />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
