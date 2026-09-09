import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Seo from '../components/Seo'
import Header from '../components/Header'
import RedirectHero from '../components/RedirectHero'
import ProjectsSection from '../components/ProjectsSection'
import AdSlot from '../components/AdSlot'
import FuelCalculator from '../components/FuelCalculator'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <Container maxWidth="sm" disableGutters>
      <Seo path="/" />
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 5,
        }}
      >
        <Header />
        <RedirectHero />
        <ProjectsSection />
        {/* TODO: replace with a real AdSense ad unit slot id once created
            in the dashboard — see src/components/AdSlot.tsx and
            CLAUDE.md "AdSense". Renders nothing until then. */}
        <AdSlot slotId="TODO-REPLACE-WITH-REAL-AD-SLOT-ID" />
        <FuelCalculator />
        <Footer />
      </Paper>
    </Container>
  )
}
