import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import SplendorAnimae from './SplendorAnimae.jsx'
import ProcessPage from './ProcessPage.jsx'
import Test from './Test.jsx'
import SpoolHero from './SpoolHero.jsx'
import HandCardHero from './HandCardHero.jsx'
import EtroLanding from './EtroLanding.jsx'
import About from './About.jsx'
import Campaign from './Campaign.jsx'
import Contact from './Contact.jsx'
import Collection1Story from './Collection1Story.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HandCardHero />} />
        <Route path="/home" element={<App />} />
        <Route path="/hand-card" element={<HandCardHero />} />
        <Route path="/demo" element={<EtroLanding />} />
        <Route path="/collections/collection1" element={<SplendorAnimae />} />
        <Route path="/collections/collection1/process/:slug" element={<ProcessPage />} />
        <Route path="/collections/collection1-story" element={<Collection1Story />} />
        <Route path="/test" element={<Test />} />
        <Route path="/spool-test" element={<SpoolHero />} />
        <Route path="/about" element={<About />} />
        <Route path="/campaign" element={<Campaign />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
