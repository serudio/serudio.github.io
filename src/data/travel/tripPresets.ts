import { recommendedSets, type RecommendedSet } from './recommended'

/**
 * Whole trips, ready to start.
 *
 * The catalogue is organised by section, which answers "what else might
 * I need" but not "I am going to the sea in July, give me a list". A
 * preset is a named handful of those sections, so starting a trip is
 * one click rather than ten.
 *
 * Each is deliberately a bit generous: it is quicker to tick off or
 * delete a line you do not need than to remember the one that is not
 * there.
 *
 * Names are Ukrainian, like the sets themselves — the catalogue renders
 * set.name directly rather than through the locale files, and a preset
 * reading differently from the sections it adds would be worse than
 * both being untranslated.
 */
export interface TripPreset {
  key: string
  name: string
  hint: string
  /** Keys from recommendedSets, in the order they should be added. */
  sets: string[]
}

/** The sections every trip wants, whatever kind of trip it is. */
const CORE = ['documents', 'toiletries', 'firstAid', 'electronics']

export const tripPresets: TripPreset[] = [
  {
    key: 'sea',
    name: 'Відпочинок на морі',
    hint: 'Пляж, сонце, купання',
    sets: [...CORE, 'seaHoliday', 'beach'],
  },
  {
    key: 'mountains',
    name: 'Гори',
    hint: 'Треки, погода, що змінюється',
    sets: [...CORE, 'mountains', 'shortHike'],
  },
  {
    key: 'road',
    name: 'Подорож автом',
    hint: 'За кермом, з зупинками',
    sets: [...CORE, 'roadTrip', 'carTravel', 'cables'],
  },
  {
    key: 'city',
    name: 'Місто на вихідні',
    hint: 'Два-три дні, без багажу в багажнику',
    sets: [...CORE, 'cityBreak'],
  },
  {
    key: 'family',
    name: 'У гості до рідних',
    hint: 'З подарунками й документами',
    sets: [...CORE, 'visitingFamily'],
  },
]

/**
 * The sets a preset names, skipping any key that no longer exists.
 *
 * A preset points at sets by key, so renaming one in the catalogue
 * would otherwise leave a preset quietly adding less than it says.
 */
export function setsForPreset(preset: TripPreset): RecommendedSet[] {
  return preset.sets
    .map((key) => recommendedSets.find((set) => set.key === key))
    .filter((set): set is RecommendedSet => set !== undefined)
}
