import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Seo from "../components/Seo";
import ProjectsSection from "../components/ProjectsSection";
import ConvertersTeaser from "../components/ConvertersTeaser";
import AdSlot from "../components/AdSlot";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <Container maxWidth="sm" disableGutters>
      <Seo path="/" />
      <Paper elevation={0} sx={{ p: 2 }}>
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
