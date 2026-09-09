import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
// import Typography from "@mui/material/Typography";
import Seo from "../components/Seo";
// import RedirectHero from "../components/RedirectHero";
import ProjectsSection from "../components/ProjectsSection";
import ConvertersTeaser from "../components/ConvertersTeaser";
import AdSlot from "../components/AdSlot";
import Footer from "../components/Footer";

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
        {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Особисті проєкти та невеликі інструменти
        </Typography>
        <RedirectHero /> */}
        <ProjectsSection />
        <ConvertersTeaser />
        {/* TODO: replace with a real AdSense ad unit slot id once created
            in the dashboard — see src/components/AdSlot.tsx and
            CLAUDE.md "AdSense". Renders nothing until then. */}
        <AdSlot slotId="TODO-REPLACE-WITH-REAL-AD-SLOT-ID" />
        <Footer />
      </Paper>
    </Container>
  );
}
