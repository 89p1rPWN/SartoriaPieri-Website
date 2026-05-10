import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Collection1 from './Collection1New.jsx'
import Test from './Test.jsx'
import HandCardHero from './HandCardHero.jsx'
import EtroLanding from './EtroLanding.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/collections/collection1" element={<Collection1 />} />
        <Route path="/test" element={<Test />} />
        <Route path="/hand-card" element={<HandCardHero />} />
        <Route path="/demo" element={<EtroLanding />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
