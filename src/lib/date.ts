/** Formats an ISO date (YYYY-MM-DD) for display; returns null if unusable. */
export function formatDate(
  isoDate: string | null | undefined,
  language = "uk",
) {
  if (!isoDate) return null;

  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(language === "uk" ? "uk-UA" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
