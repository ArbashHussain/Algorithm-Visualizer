import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import FloatingButton from "./components/FloatingButton"
import Menu from "./components/Menu"
import About from "./pages/About"
import AIPage from "./pages/AIPage"
import PathfinderPage from "./pages/PathfinderPage"
import SortingPage from "./pages/SortingPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/pathfinding" element={<PathfinderPage />} />
        <Route path="/sorting" element={<SortingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingButton />
    </BrowserRouter>
  )
}

export default App
