import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Collection1 from './Collection1New.jsx'
import Test from './Test.jsx'
import SpoolHero from './SpoolHero.jsx'
import HandCardHero from './HandCardHero.jsx'
import About from './About.jsx'
import Campaign from './Campaign.jsx'
import Contact from './Contact.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/collections/collection1" element={<Collection1 />} />
        <Route path="/test" element={<Test />} />
        <Route path="/spool-test" element={<SpoolHero />} />
        <Route path="/hand-card" element={<HandCardHero />} />
        <Route path="/about" element={<About />} />
        <Route path="/campaign" element={<Campaign />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
