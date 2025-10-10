import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import './styles/base.css'
import App from './App'
import Health from './pages/Health'
import Chat from './pages/Chat'
import Datasets from './pages/Datasets'
import Dashboard from './pages/Dashboard'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/health" element={<Health />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/datasets" element={<Datasets />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

