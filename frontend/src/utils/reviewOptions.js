export const CATEGORY_TABS = [
  { value: 'game', label: 'Videojuegos', shortLabel: 'Games' },
  { value: 'movie', label: 'Películas', shortLabel: 'Films' },
  { value: 'series', label: 'Series', shortLabel: 'Series' },
  { value: 'book', label: 'Libros', shortLabel: 'Books' },
]

const ASPECTS_BY_CATEGORY = {
  game: [
    { key: 'gameplay', label: 'Jugabilidad' },
    { key: 'story', label: 'Historia' },
    { key: 'sound', label: 'Sonido' },
    { key: 'art-direction', label: 'Dirección artística' },
    { key: 'performance', label: 'Rendimiento' },
  ],
  movie: [
    { key: 'direction', label: 'Dirección' },
    { key: 'script', label: 'Guión' },
    { key: 'cinematography', label: 'Fotografía' },
    { key: 'soundtrack', label: 'Banda sonora' },
    { key: 'performances', label: 'Interpretaciones' },
  ],
  series: [
    { key: 'writing', label: 'Escritura' },
    { key: 'characters', label: 'Personajes' },
    { key: 'pacing', label: 'Ritmo' },
    { key: 'soundtrack', label: 'Banda sonora' },
    { key: 'ending', label: 'Cierre de temporada' },
  ],
  book: [
    { key: 'prose', label: 'Prosa' },
    { key: 'characters', label: 'Personajes' },
    { key: 'worldbuilding', label: 'Mundo' },
    { key: 'pacing', label: 'Ritmo' },
    { key: 'originality', label: 'Originalidad' },
  ],
}

export function getCategoryLabel(category) {
  return CATEGORY_TABS.find((item) => item.value === category)?.label || category
}

export function getAspectFields(category) {
  return ASPECTS_BY_CATEGORY[category] || ASPECTS_BY_CATEGORY.movie
}

export function createDefaultAspectRatings(category) {
  return getAspectFields(category).reduce((accumulator, item) => {
    accumulator[item.key] = 7
    return accumulator
  }, {})
}

export function formatAspectLabel(key) {
  return key
    .split('-')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}
