import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Header from "../components/Header";
// import RedirectHero from "../components/RedirectHero";
import ProjectsSection from "../components/ProjectsSection";
import FuelCalculator from "../components/FuelCalculator";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <Container maxWidth="sm" disableGutters>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 5,
        }}
      >
        <Header />
        {/* <RedirectHero /> */}
        <ProjectsSection />
        <FuelCalculator />
        <Footer />
      </Paper>
    </Container>
  );
}
