function svgDataUrl(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function characterSvg(label, skin, hair, clothes, accent, extra = '') {
  return svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="26" fill="#11161d"/>
  <rect x="10" y="10" width="108" height="108" rx="22" fill="#18212b" stroke="#2f4155" stroke-width="4"/>
  <rect x="28" y="86" width="72" height="16" rx="5" fill="#223041"/>
  <rect x="44" y="58" width="40" height="34" rx="5" fill="${clothes}"/>
  <rect x="50" y="34" width="28" height="28" rx="6" fill="${skin}"/>
  <rect x="46" y="28" width="36" height="14" rx="5" fill="${hair}"/>
  <rect x="50" y="40" width="7" height="7" rx="2" fill="#11161d"/>
  <rect x="71" y="40" width="7" height="7" rx="2" fill="#11161d"/>
  <rect x="58" y="53" width="12" height="4" rx="2" fill="#7a4b3a"/>
  <rect x="36" y="62" width="12" height="24" rx="4" fill="${skin}"/>
  <rect x="80" y="62" width="12" height="24" rx="4" fill="${skin}"/>
  <rect x="48" y="92" width="12" height="14" rx="3" fill="#2f4155"/>
  <rect x="68" y="92" width="12" height="14" rx="3" fill="#2f4155"/>
  <rect x="88" y="22" width="18" height="18" rx="5" fill="${accent}"/>
  ${extra}
  <text x="64" y="116" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="800" fill="#93a1b1">${label}</text>
</svg>`)
}

export const AVATAR_PRESETS = [
  {
    id: 'archivist',
    label: 'Archivista',
    value: 'preset:archivist',
    image: characterSvg('ARCH', '#d8a275', '#5a3427', '#7fa2c9', '#c79654', '<rect x="57" y="63" width="14" height="20" rx="3" fill="#e8edf3"/>'),
  },
  {
    id: 'ranger',
    label: 'Exploradora',
    value: 'preset:ranger',
    image: characterSvg('EXP', '#c98f68', '#2d241f', '#8fbf7f', '#7fa2c9', '<rect x="42" y="25" width="44" height="8" rx="3" fill="#2f4155"/>'),
  },
  {
    id: 'scribe',
    label: 'Cronista',
    value: 'preset:scribe',
    image: characterSvg('CRON', '#e0b084', '#6b4a36', '#c79654', '#e8edf3', '<path d="M84 58 L101 42" stroke="#e8edf3" stroke-width="6" stroke-linecap="round"/>'),
  },
  {
    id: 'warden',
    label: 'Guarda',
    value: 'preset:warden',
    image: characterSvg('GUAR', '#b98262', '#1f2933', '#2f4155', '#8fbf7f', '<rect x="46" y="24" width="36" height="10" rx="3" fill="#7fa2c9"/>'),
  },
  {
    id: 'seer',
    label: 'Vidente',
    value: 'preset:seer',
    image: characterSvg('VID', '#d6a078', '#e8edf3', '#6d7fa4', '#f0c35a', '<circle cx="64" cy="72" r="8" fill="#f0c35a"/>'),
  },
  {
    id: 'runner',
    label: 'Runner',
    value: 'preset:runner',
    image: characterSvg('RUN', '#c58b66', '#3a241b', '#d96f61', '#7fa2c9', '<rect x="42" y="64" width="44" height="8" rx="4" fill="#11161d" opacity=".35"/>'),
  },
  {
    id: 'builder',
    label: 'Builder',
    value: 'preset:builder',
    image: characterSvg('BLD', '#d29b75', '#8a5c2f', '#d8c18a', '#c79654', '<rect x="48" y="23" width="32" height="10" rx="2" fill="#f0c35a"/>'),
  },
  {
    id: 'keeper',
    label: 'Keeper',
    value: 'preset:keeper',
    image: characterSvg('KEEP', '#b77c5d', '#121820', '#223041', '#d96f61', '<rect x="56" y="62" width="16" height="24" rx="3" fill="#7fa2c9"/>'),
  },
]

export function getAvatarImage(value) {
  if (!value) {
    return ''
  }

  if (!value.startsWith('preset:')) {
    return value
  }

  return AVATAR_PRESETS.find((preset) => preset.value === value)?.image || ''
}
