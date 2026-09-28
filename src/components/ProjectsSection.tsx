import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { projects } from "../data/projects";

export default function ProjectsSection() {
  const { t } = useTranslation();

  return (
    <Box sx={{ mb: 3 }}>
      {/* <Typography variant="h6" sx={{ mb: 2 }}>
        {t("projects.heading")}
      </Typography> */}
      <Stack spacing={1.5}>
        {projects.map((project) => (
          <Card key={project.titleKey} variant="outlined">
            <CardContent
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                "&:last-child": { pb: 2 },
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t(project.titleKey)}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {t(project.descriptionKey)}
                </Typography>
              </Box>
              <CardActions sx={{ p: 0 }}>
                <Button
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon fontSize="small" />}
                  size="small"
                >
                  {t("projects.open")}
                </Button>
              </CardActions>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
