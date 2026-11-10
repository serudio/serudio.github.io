import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import SiteHeader from "./components/SiteHeader";
import HomePage from "./pages/HomePage";
import ConvertersIndexPage from "./pages/ConvertersIndexPage";
import PrivacyPage from "./pages/PrivacyPage";
import SignInPage from "./pages/SignInPage";
import BooksPage from "./pages/books/BooksPage";
import BooksAdminPage from "./pages/books/BooksAdminPage";
import RequireAuth from "./auth/RequireAuth";
import { useAuthReturn } from "./auth/useAuthReturn";
import { converters } from "./data/converters";

export default function App() {
  useAuthReturn();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        p: 2,
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
                <Page
                  slug={slug}
                  titleKey={titleKey}
                  seoDescriptionKey={seoDescriptionKey}
                />
              </Suspense>
            }
          />
        ))}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/signin" element={<SignInPage />} />

        {/*
          Both spellings render the catalogue. "/books/" is the indexed,
          canonical URL (see src/pages/books/paths.ts); "/books" exists so
          the in-app link and a hand-typed URL don't 404 before GitHub
          Pages gets a chance to redirect.
        */}
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/" element={<BooksPage />} />
        <Route
          path="/books/admin"
          element={
            <RequireAuth admin>
              <BooksAdminPage />
            </RequireAuth>
          }
        />
      </Routes>
    </Box>
  );
}
