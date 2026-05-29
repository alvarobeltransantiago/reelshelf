import { create } from 'zustand'

const STORAGE_KEY = 'reelshelf-music'

let audioContext = null
let masterGain = null
let ambienceDelay = null
let ambienceFeedback = null
let ambienceFilter = null
let phraseTimer = null
let padTimer = null
let sparkleTimer = null
let sceneTimer = null
let isAmbientRunning = false
let bedNodes = []
let currentSceneIndex = 0
let deferredStartHandler = null

const AMBIENT_SCENES = [
  {
    name: 'forest',
    scale: [196, 220, 246.94, 293.66, 329.63, 392, 440, 493.88, 587.33],
    lowNotes: [73.42, 98, 146.83, 196],
    colors: [293.66, 329.63, 392, 493.88],
  },
  {
    name: 'rain',
    scale: [174.61, 196, 220, 261.63, 293.66, 349.23, 392, 440, 523.25],
    lowNotes: [87.31, 130.81, 174.61, 261.63],
    colors: [261.63, 349.23, 440, 523.25],
  },
  {
    name: 'dawn',
    scale: [164.81, 196, 220, 246.94, 293.66, 329.63, 392, 493.88, 659.25],
    lowNotes: [82.41, 123.47, 164.81, 246.94],
    colors: [246.94, 329.63, 493.88, 659.25],
  },
  {
    name: 'snow',
    scale: [146.83, 174.61, 196, 220, 261.63, 293.66, 349.23, 440, 587.33],
    lowNotes: [73.42, 110, 146.83, 220],
    colors: [220, 293.66, 440, 587.33],
  },
]

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function pick(values) {
  return values[Math.floor(Math.random() * values.length)]
}

function getStoredMusicPreference() {
  try {
    const storedPreference = window.localStorage.getItem(STORAGE_KEY)

    if (!storedPreference) {
      return { isPlaying: false, volume: 0.45 }
    }

    const parsedPreference = JSON.parse(storedPreference)

    return {
      isPlaying: Boolean(parsedPreference.isPlaying),
      volume: getSafeVolume(parsedPreference.volume),
    }
  } catch {
    return { isPlaying: false, volume: 0.45 }
  }
}

function saveMusicPreference({ isPlaying, volume }) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      isPlaying: Boolean(isPlaying),
      volume: getSafeVolume(volume),
    }),
  )
}

function getCurrentScene() {
  return AMBIENT_SCENES[currentSceneIndex] ?? AMBIENT_SCENES[0]
}

function clearDeferredStart() {
  if (!deferredStartHandler) {
    return
  }

  window.removeEventListener('pointerdown', deferredStartHandler)
  window.removeEventListener('keydown', deferredStartHandler)
  deferredStartHandler = null
}

function deferStartUntilInteraction(getVolume) {
  if (deferredStartHandler) {
    return
  }

  deferredStartHandler = async () => {
    clearDeferredStart()

    try {
      await startAmbientMusic(getVolume())
    } catch {
      return
    }
  }

  window.addEventListener('pointerdown', deferredStartHandler, { once: true })
  window.addEventListener('keydown', deferredStartHandler, { once: true })
}

function clearAmbientTimers() {
  if (phraseTimer) {
    window.clearTimeout(phraseTimer)
    phraseTimer = null
  }

  if (padTimer) {
    window.clearTimeout(padTimer)
    padTimer = null
  }

  if (sparkleTimer) {
    window.clearTimeout(sparkleTimer)
    sparkleTimer = null
  }

  if (sceneTimer) {
    window.clearTimeout(sceneTimer)
    sceneTimer = null
  }
}

function stopBedNodes() {
  if (!audioContext) {
    bedNodes = []
    return
  }

  const now = audioContext.currentTime

  bedNodes.forEach(({ oscillator, gain }) => {
    gain.gain.cancelScheduledValues(now)
    gain.gain.setTargetAtTime(0.0001, now, 0.2)
    oscillator.stop(now + 0.8)
  })

  bedNodes = []
}

function getSafeVolume(value) {
  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return 0.45
  }

  return Math.min(1, Math.max(0, numericValue))
}

function getOutputGain(volume) {
  return 0.02 + getSafeVolume(volume) * 0.22
}

function applyVolume(volume) {
  if (!audioContext || !masterGain) {
    return
  }

  const now = audioContext.currentTime
  masterGain.gain.cancelScheduledValues(now)
  masterGain.gain.setTargetAtTime(getOutputGain(volume), now, 0.08)
}

function createAmbientGraph(volume) {
  audioContext = new AudioContext()
  masterGain = audioContext.createGain()
  ambienceDelay = audioContext.createDelay(4)
  ambienceFeedback = audioContext.createGain()
  ambienceFilter = audioContext.createBiquadFilter()

  masterGain.gain.value = getOutputGain(volume)
  ambienceDelay.delayTime.value = 0.42
  ambienceFeedback.gain.value = 0.28
  ambienceFilter.type = 'lowpass'
  ambienceFilter.frequency.value = 2600

  ambienceDelay.connect(ambienceFeedback)
  ambienceFeedback.connect(ambienceDelay)
  ambienceDelay.connect(ambienceFilter)
  ambienceFilter.connect(masterGain)
  masterGain.connect(audioContext.destination)
}

function scheduleTone(frequency, startTime, duration, gainValue, type = 'sine', panValue = 0) {
  if (!audioContext || !ambienceDelay) {
    return
  }

  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  const panner = audioContext.createStereoPanner()
  const attack = Math.min(0.45, duration * 0.28)
  const releaseStart = startTime + Math.max(attack, duration - 0.8)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  oscillator.detune.setValueAtTime(randomBetween(-4, 4), startTime)
  panner.pan.value = panValue
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + attack)
  gain.gain.setValueAtTime(gainValue, releaseStart)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(gain)
  gain.connect(panner)
  panner.connect(ambienceDelay)
  panner.connect(masterGain)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.1)
}

function startContinuousBed() {
  if (!audioContext || !ambienceDelay || bedNodes.length) {
    return
  }

  const now = audioContext.currentTime
  const bedFrequencies = getCurrentScene().lowNotes

  bedNodes = bedFrequencies.map((frequency, index) => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const panner = audioContext.createStereoPanner()

    oscillator.type = index === 1 ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(frequency, now)
    oscillator.detune.setValueAtTime(index === 2 ? randomBetween(3, 7) : randomBetween(-5, -1), now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.022 : index === 3 ? 0.009 : 0.015, now + 1.4)
    panner.pan.value = index === 0 ? -0.24 : index === 1 ? 0.18 : index === 2 ? 0.04 : 0.28

    oscillator.connect(gain)
    gain.connect(panner)
    panner.connect(masterGain)
    panner.connect(ambienceDelay)
    oscillator.start(now)

    return { oscillator, gain, panner }
  })
}

function schedulePhrase() {
  if (!isAmbientRunning || !audioContext) {
    return
  }

  const scene = getCurrentScene()
  const startTime = audioContext.currentTime + 0.08
  const noteCount = Math.floor(randomBetween(2, 6))
  const direction = Math.random() > 0.5 ? 1 : -1
  let scaleIndex = Math.floor(randomBetween(1, scene.scale.length - 2))
  let cursor = startTime

  for (let index = 0; index < noteCount; index += 1) {
    scaleIndex = Math.min(scene.scale.length - 1, Math.max(0, scaleIndex + direction * Math.floor(randomBetween(0, 3))))
    const frequency = scene.scale[scaleIndex]
    const duration = randomBetween(1.5, 3.4)
    const toneType = index % 3 === 0 ? 'triangle' : 'sine'

    scheduleTone(frequency, cursor, duration, randomBetween(0.02, 0.04), toneType, randomBetween(-0.36, 0.36))

    if (Math.random() > 0.68) {
      scheduleTone(frequency * 1.5, cursor + randomBetween(0.18, 0.5), duration * 0.72, 0.012, 'sine', randomBetween(-0.5, 0.5))
    }

    cursor += randomBetween(0.7, 1.65)
  }

  phraseTimer = window.setTimeout(schedulePhrase, randomBetween(3200, 7800))
}

function schedulePad() {
  if (!isAmbientRunning || !audioContext) {
    return
  }

  const scene = getCurrentScene()
  const startTime = audioContext.currentTime + 0.1
  const root = pick(scene.lowNotes)
  const color = pick(scene.colors)
  const duration = randomBetween(12, 19)

  scheduleTone(root, startTime, duration, 0.032, 'sine', -0.18)
  scheduleTone(color, startTime + randomBetween(0.25, 0.75), duration * 0.88, 0.02, 'triangle', 0.16)
  scheduleTone(root * 2, startTime + randomBetween(0.55, 1.1), duration * 0.74, 0.014, 'sine', 0.28)

  padTimer = window.setTimeout(schedulePad, randomBetween(7600, 12800))
}

function scheduleSparkle() {
  if (!isAmbientRunning || !audioContext) {
    return
  }

  const scene = getCurrentScene()
  const startTime = audioContext.currentTime + randomBetween(0.1, 0.7)
  const frequency = pick(scene.colors) * (Math.random() > 0.65 ? 2 : 1)

  scheduleTone(frequency, startTime, randomBetween(1.2, 2.6), randomBetween(0.009, 0.018), 'sine', randomBetween(-0.62, 0.62))

  if (Math.random() > 0.72) {
    scheduleTone(frequency * 0.75, startTime + randomBetween(0.35, 0.9), randomBetween(1.1, 2.2), 0.008, 'triangle', randomBetween(-0.5, 0.5))
  }

  sparkleTimer = window.setTimeout(scheduleSparkle, randomBetween(6800, 16800))
}

function scheduleSceneChange() {
  if (!isAmbientRunning) {
    return
  }

  sceneTimer = window.setTimeout(() => {
    if (!isAmbientRunning) {
      return
    }

    currentSceneIndex = (currentSceneIndex + 1) % AMBIENT_SCENES.length
    stopBedNodes()

    window.setTimeout(() => {
      if (isAmbientRunning) {
        startContinuousBed()
      }
    }, 900)

    scheduleSceneChange()
  }, randomBetween(38000, 68000))
}

async function startAmbientMusic(volume) {
  if (isAmbientRunning) {
    applyVolume(volume)
    return
  }

  if (!audioContext) {
    createAmbientGraph(volume)
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  if (audioContext.state !== 'running') {
    throw new Error('Audio context is waiting for user interaction')
  }

  isAmbientRunning = true
  currentSceneIndex = Math.floor(randomBetween(0, AMBIENT_SCENES.length))
  startContinuousBed()
  schedulePad()
  schedulePhrase()
  scheduleSparkle()
  scheduleSceneChange()
}

async function stopAmbientMusic() {
  isAmbientRunning = false
  clearDeferredStart()
  clearAmbientTimers()
  stopBedNodes()

  if (!audioContext || !masterGain) {
    return
  }

  const now = audioContext.currentTime
  masterGain.gain.cancelScheduledValues(now)
  masterGain.gain.setValueAtTime(masterGain.gain.value, now)
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

  await new Promise((resolve) => {
    window.setTimeout(resolve, 380)
  })

  await audioContext.close()
  audioContext = null
  masterGain = null
  ambienceDelay = null
  ambienceFeedback = null
  ambienceFilter = null
}

const initialMusicPreference = getStoredMusicPreference()

const useMusicStore = create((set, get) => ({
  isPlaying: initialMusicPreference.isPlaying,
  volume: initialMusicPreference.volume,
  async initializeMusicPreference() {
    if (!get().isPlaying) {
      return
    }

    try {
      await startAmbientMusic(get().volume)
    } catch {
      deferStartUntilInteraction(() => get().volume)
    }
  },
  async toggleMusic() {
    if (get().isPlaying) {
      set({ isPlaying: false })
      saveMusicPreference({ isPlaying: false, volume: get().volume })
      await stopAmbientMusic()
      return
    }

    set({ isPlaying: true })
    saveMusicPreference({ isPlaying: true, volume: get().volume })

    try {
      await startAmbientMusic(get().volume)
    } catch {
      deferStartUntilInteraction(() => get().volume)
    }
  },
  setVolume(volume) {
    const safeVolume = getSafeVolume(volume)
    set({ volume: safeVolume })
    saveMusicPreference({ isPlaying: get().isPlaying, volume: safeVolume })
    applyVolume(safeVolume)
  },
}))

export default useMusicStore
