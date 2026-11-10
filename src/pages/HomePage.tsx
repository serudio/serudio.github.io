import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import SearchIcon from '@mui/icons-material/Search'
import LoginIcon from '@mui/icons-material/Login'
import Button from '@mui/material/Button'
import Seo from '../components/Seo'
import Footer from '../components/Footer'
import LinkChip from '../components/home/LinkChip'
import {
  GROUP_HEADING_KEYS,
  HOME_LINK_GROUPS,
  findHomeLink,
  homePageLinks,
  type HomeLink,
} from '../data/homeLinks'
import { localUsageStore } from '../lib/usage'
import { useAuth } from '../auth/useAuth'

/** How many shortcuts the "most used" row offers before it stops helping. */
const MOST_USED_LIMIT = 5

function SectionHeading({ children }: { children: string }) {
  return (
    <Typography
      variant="caption"
      sx={{
        // Lowercase: 0.05em tracking suits small caps, but reads as gaps
        // in lowercase, so the letter spacing comes down with it.
        textTransform: 'lowercase',
        letterSpacing: '0.02em',
        color: 'text.secondary',
        fontWeight: 600,
        display: 'block',
        mb: 1.25,
      }}
    >
      {children}
    </Typography>
  )
}

function ChipRow({ links, onOpen }: { links: HomeLink[]; onOpen: (id: string) => void }) {
  return (
    <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ rowGap: 1 }}>
      {links.map((link) => (
        <LinkChip key={link.id} link={link} onOpen={onOpen} />
      ))}
    </Stack>
  )
}

/**
 * A compact index of everything on the site: one chip per destination,
 * grouped, searchable, with the visitor's most-opened links offered
 * first. Replaces the stack of project cards and the converters teaser —
 * the list is expected to keep growing, and cards did not scale.
 */
export default function HomePage() {
  const { t } = useTranslation()
  const { session, loading: authLoading, configured, signIn } = useAuth()
  const [query, setQuery] = useState('')

  // Read once per mount: the counts only change when a link is opened,
  // and that navigates away.
  const [mostUsedIds] = useState(() =>
    localUsageStore.top(MOST_USED_LIMIT).map((entry) => entry.id),
  )

  const handleOpen = useCallback((id: string) => localUsageStore.record(id), [])

  // Matching happens on the translated label so search works in whichever
  // language the visitor is reading.
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return homePageLinks
    return homePageLinks.filter((link) => t(link.labelKey).toLowerCase().includes(needle))
  }, [query, t])

  const mostUsed = useMemo(
    () =>
      query.trim()
        ? []
        : mostUsedIds
            .map(findHomeLink)
            // navOnly too: a link kept off this page should not come
            // back through the shortcuts because it was used before.
            .filter((link): link is HomeLink => link !== undefined && !link.navOnly),
    [mostUsedIds, query],
  )

  return (
    <Container maxWidth="sm" disableGutters>
      <Seo path="/" />
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 } }}>
        <TextField
          fullWidth
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('home.searchPlaceholder')}
          aria-label={t('home.searchPlaceholder')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {configured && !authLoading && !session && (
          <Box sx={{ mb: 3 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<LoginIcon fontSize="small" />}
              onClick={() => void signIn('/')}
            >
              {t('auth.signInTitle')}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              {t('home.signInHint')}
            </Typography>
          </Box>
        )}

        {mostUsed.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <SectionHeading>{t('home.mostUsed')}</SectionHeading>
            <ChipRow links={mostUsed} onOpen={handleOpen} />
          </Box>
        )}

        {HOME_LINK_GROUPS.map((group) => {
          const links = matches.filter((link) => link.group === group)
          if (links.length === 0) return null

          return (
            <Box key={group} sx={{ mb: 3 }}>
              <SectionHeading>{t(GROUP_HEADING_KEYS[group])}</SectionHeading>
              <ChipRow links={links} onOpen={handleOpen} />
            </Box>
          )
        })}

        {matches.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('home.noMatches', { query: query.trim() })}
          </Typography>
        )}

        {/* NO AD SLOT HERE, deliberately. This page is a list of links —
            navigation, with no publisher content of its own. AdSense
            forbids ads on screens "used for notifications, navigation and
            other actions", and an ad here was cited in a policy review.
            Don't add one back unless this page grows real content.
            See CLAUDE.md, section "AdSense". */}
        <Footer />
      </Paper>
    </Container>
  )
}
