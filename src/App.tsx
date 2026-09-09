import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import SiteHeader from './components/SiteHeader'
import HomePage from './pages/HomePage'
import ConvertersIndexPage from './pages/ConvertersIndexPage'
import PrivacyPage from './pages/PrivacyPage'
import { converters } from './data/converters'

export default function App() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        py: { xs: 4, sm: 6 },
        px: 2,
      }}
    >
      <Container maxWidth="sm" disableGutters>
        <SiteHeader />
      </Container>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/converters" element={<ConvertersIndexPage />} />
        {converters.map(({ slug, titleKey, seoDescriptionKey, Page }) => (
          <Route
            key={slug}
            path={`/converters/${slug}`}
            element={
              <Suspense fallback={null}>
                <Page slug={slug} titleKey={titleKey} seoDescriptionKey={seoDescriptionKey} />
              </Suspense>
            }
          />
        ))}
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </Box>
  )
}
