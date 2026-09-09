import { Routes, Route } from 'react-router-dom'
import Box from '@mui/material/Box'
import HomePage from './pages/HomePage'
import PrivacyPage from './pages/PrivacyPage'

export default function App() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        py: { xs: 4, sm: 6 },
        px: 2,
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </Box>
  )
}
