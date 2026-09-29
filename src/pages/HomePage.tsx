import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Seo from "../components/Seo";
import ProjectsSection from "../components/ProjectsSection";
import ConvertersTeaser from "../components/ConvertersTeaser";
import Footer from "../components/Footer";
import ConvertersIndexPage from "./ConvertersIndexPage";

export default function HomePage() {
  return (
    <Container maxWidth="sm" disableGutters>
      <Seo path="/" />
      <Paper elevation={0} sx={{ p: 2 }}>
        <ProjectsSection />
        <ConvertersTeaser />
        <ConvertersIndexPage />
        {/* NO AD SLOT HERE, deliberately. This page is a list of links to
            the projects and converters — navigation, with no publisher
            content of its own. AdSense forbids ads on screens "used for
            notifications, navigation and other actions", and an ad here
            was cited in a policy review. Don't add one back unless this
            page grows real content. See CLAUDE.md, section "AdSense". */}
        <Footer />
      </Paper>
    </Container>
  );
}
