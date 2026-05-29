function svgDataUrl(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function classAvatarSvg({ skin = '#d8a275', hair = '#5a3427', outfit, accent, secondary = '#223041', extra = '' }) {
  return svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#10161f"/>
  <rect x="9" y="9" width="110" height="110" rx="26" fill="#172330" stroke="#32465d" stroke-width="4"/>
  <circle cx="64" cy="60" r="42" fill="${secondary}" opacity=".42"/>
  <rect x="34" y="82" width="60" height="28" rx="9" fill="${outfit}"/>
  <rect x="42" y="70" width="44" height="28" rx="7" fill="${outfit}"/>
  <rect x="46" y="38" width="36" height="36" rx="9" fill="${skin}"/>
  <rect x="42" y="30" width="44" height="20" rx="8" fill="${hair}"/>
  <rect x="51" y="52" width="8" height="8" rx="2" fill="#10161f"/>
  <rect x="69" y="52" width="8" height="8" rx="2" fill="#10161f"/>
  <rect x="56" y="66" width="16" height="5" rx="2" fill="#744838"/>
  <rect x="27" y="82" width="17" height="22" rx="6" fill="${accent}"/>
  <rect x="84" y="82" width="17" height="22" rx="6" fill="${accent}"/>
  ${extra}
</svg>`)
}

export const AVATAR_PRESETS = [
  {
    id: 'wizard',
    label: 'Mago',
    value: 'preset:wizard',
    image: classAvatarSvg({
      skin: '#d6a078',
      hair: '#e7e2cf',
      outfit: '#355486',
      accent: '#9cb8df',
      secondary: '#24395c',
      extra: `
        <path d="M43 38 L64 12 L85 38 Z" fill="#3b5f98"/>
        <rect x="51" y="34" width="26" height="8" rx="3" fill="#e2b85f"/>
        <circle cx="78" cy="20" r="5" fill="#f2d37a"/>
        <rect x="92" y="42" width="7" height="52" rx="3" fill="#8a6335"/>
        <circle cx="95.5" cy="38" r="9" fill="#83b9ff"/>
      `,
    }),
  },
  {
    id: 'warrior',
    label: 'Guerrero',
    value: 'preset:warrior',
    image: classAvatarSvg({
      skin: '#c98f68',
      hair: '#9aa7b4',
      outfit: '#4f5f6f',
      accent: '#c0cad4',
      secondary: '#273443',
      extra: `
        <rect x="41" y="28" width="46" height="19" rx="7" fill="#8fa1b3"/>
        <rect x="55" y="22" width="18" height="12" rx="4" fill="#c6d0db"/>
        <rect x="30" y="45" width="8" height="48" rx="3" fill="#c4ced8"/>
        <rect x="25" y="41" width="18" height="8" rx="3" fill="#d7b25b"/>
        <rect x="86" y="70" width="25" height="33" rx="9" fill="#924846"/>
        <rect x="96" y="77" width="5" height="18" rx="2" fill="#d9c36d"/>
      `,
    }),
  },
  {
    id: 'druid',
    label: 'Druida',
    value: 'preset:druid',
    image: classAvatarSvg({
      skin: '#c68f66',
      hair: '#6d4b2f',
      outfit: '#416d45',
      accent: '#8fbf7f',
      secondary: '#253c30',
      extra: `
        <path d="M48 36 C38 24 38 17 44 14 C50 18 54 26 55 36 Z" fill="#a97b45"/>
        <path d="M80 36 C90 24 90 17 84 14 C78 18 74 26 73 36 Z" fill="#a97b45"/>
        <circle cx="39" cy="42" r="8" fill="#79a86d"/>
        <circle cx="89" cy="42" r="8" fill="#79a86d"/>
        <rect x="55" y="84" width="18" height="18" rx="5" fill="#9fd08d"/>
        <path d="M64 84 C58 92 60 98 64 103 C68 98 70 92 64 84 Z" fill="#315a35"/>
      `,
    }),
  },
  {
    id: 'hunter',
    label: 'Cazador',
    value: 'preset:hunter',
    image: classAvatarSvg({
      skin: '#b98262',
      hair: '#263026',
      outfit: '#35513a',
      accent: '#b88951',
      secondary: '#25362a',
      extra: `
        <path d="M39 49 C44 24 84 24 89 49 L78 43 L50 43 Z" fill="#263b2b"/>
        <rect x="49" y="35" width="30" height="9" rx="3" fill="#4c724f"/>
        <path d="M94 38 C110 55 110 78 94 95" fill="none" stroke="#b88951" stroke-width="7" stroke-linecap="round"/>
        <path d="M93 67 L108 61" stroke="#d8c18a" stroke-width="5" stroke-linecap="round"/>
        <path d="M103 58 L111 61 L105 66" fill="#d8c18a"/>
      `,
    }),
  },
  {
    id: 'paladin',
    label: 'Paladin',
    value: 'preset:paladin',
    image: classAvatarSvg({
      skin: '#d7a174',
      hair: '#e3d5a0',
      outfit: '#d6b35c',
      accent: '#edf1f5',
      secondary: '#4e432a',
      extra: `
        <rect x="39" y="30" width="50" height="20" rx="8" fill="#d9c36d"/>
        <rect x="56" y="22" width="16" height="14" rx="4" fill="#f4dc83"/>
        <rect x="60" y="78" width="8" height="26" rx="3" fill="#fff0a6"/>
        <rect x="51" y="87" width="26" height="8" rx="3" fill="#fff0a6"/>
        <rect x="87" y="66" width="23" height="37" rx="10" fill="#e8edf3"/>
        <rect x="96" y="73" width="5" height="20" rx="2" fill="#d6b35c"/>
      `,
    }),
  },
  {
    id: 'farmer',
    label: 'Granjero',
    value: 'preset:farmer',
    image: classAvatarSvg({
      skin: '#d29b75',
      hair: '#7b4b2d',
      outfit: '#4f80a8',
      accent: '#d8c18a',
      secondary: '#3b3323',
      extra: `
        <rect x="39" y="27" width="50" height="13" rx="5" fill="#d8b35f"/>
        <rect x="50" y="18" width="28" height="16" rx="6" fill="#e3c36e"/>
        <rect x="49" y="82" width="8" height="26" rx="3" fill="#d8c18a"/>
        <rect x="71" y="82" width="8" height="26" rx="3" fill="#d8c18a"/>
        <path d="M93 48 L102 74 L96 74 L88 50 Z" fill="#b88951"/>
        <path d="M97 45 C89 50 90 57 97 61 C105 57 105 50 97 45 Z" fill="#e6c95d"/>
      `,
    }),
  },
  {
    id: 'beast',
    label: 'Bestia',
    value: 'preset:beast',
    image: classAvatarSvg({
      skin: '#8d5f43',
      hair: '#4b3527',
      outfit: '#5d4636',
      accent: '#a56b4d',
      secondary: '#322822',
      extra: `
        <path d="M45 35 L35 19 L57 29 Z" fill="#4b3527"/>
        <path d="M83 35 L93 19 L71 29 Z" fill="#4b3527"/>
        <rect x="43" y="35" width="42" height="40" rx="13" fill="#8d5f43"/>
        <rect x="49" y="43" width="10" height="8" rx="2" fill="#10161f"/>
        <rect x="69" y="43" width="10" height="8" rx="2" fill="#10161f"/>
        <rect x="58" y="55" width="12" height="8" rx="4" fill="#37241d"/>
        <path d="M54 68 L60 80 L66 68 L72 80 L78 68" fill="#e8d8bd"/>
      `,
    }),
  },
  {
    id: 'robot',
    label: 'Robot',
    value: 'preset:robot',
    image: classAvatarSvg({
      skin: '#9aa7b4',
      hair: '#667482',
      outfit: '#4d6377',
      accent: '#7fa2c9',
      secondary: '#273443',
      extra: `
        <rect x="45" y="36" width="38" height="38" rx="8" fill="#9aa7b4"/>
        <rect x="50" y="24" width="28" height="10" rx="4" fill="#667482"/>
        <rect x="61" y="14" width="6" height="13" rx="3" fill="#7fa2c9"/>
        <circle cx="64" cy="12" r="5" fill="#d8c18a"/>
        <rect x="52" y="51" width="9" height="8" rx="2" fill="#83b9ff"/>
        <rect x="67" y="51" width="9" height="8" rx="2" fill="#83b9ff"/>
        <rect x="55" y="66" width="18" height="5" rx="2" fill="#32465d"/>
        <rect x="49" y="84" width="30" height="9" rx="3" fill="#83b9ff"/>
      `,
    }),
  },
]

const LEGACY_AVATAR_MAP = {
  'preset:archivist': 'preset:wizard',
  'preset:ranger': 'preset:hunter',
  'preset:scribe': 'preset:paladin',
  'preset:warden': 'preset:warrior',
  'preset:seer': 'preset:druid',
  'preset:runner': 'preset:beast',
  'preset:builder': 'preset:farmer',
  'preset:keeper': 'preset:robot',
}

export function getAvatarImage(value) {
  if (!value) {
    return ''
  }

  if (!value.startsWith('preset:')) {
    return value
  }

  const presetValue = LEGACY_AVATAR_MAP[value] || value

  return AVATAR_PRESETS.find((preset) => preset.value === presetValue)?.image || ''
}
