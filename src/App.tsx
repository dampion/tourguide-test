import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Exam from './pages/Exam'
import Home from './pages/Home'
import Result from './pages/Result'
import Setup from './pages/Setup'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  )
}
