let sharedContext = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!sharedContext || sharedContext.state === 'closed') {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    sharedContext = new AudioCtx()
  }
  return sharedContext
}

function resumeContext() {
  const ctx = getAudioContext()
  if (!ctx) return null
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  return ctx
}

export function playTone({ frequency = 440, duration = 0.12, type = 'sine', volume = 0.05 } = {}) {
  const ctx = resumeContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.value = frequency

  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration + 0.02)
}

export function playUiSound(kind) {
  switch (kind) {
    case 'success':
      playTone({ frequency: 520, duration: 0.12, type: 'triangle', volume: 0.07 })
      setTimeout(() => playTone({ frequency: 720, duration: 0.12, type: 'triangle', volume: 0.06 }), 90)
      return
    case 'fail':
      playTone({ frequency: 180, duration: 0.2, type: 'sawtooth', volume: 0.06 })
      return
    case 'click':
    default:
      playTone({ frequency: 420, duration: 0.06, type: 'square', volume: 0.03 })
  }
}

function getAmbientFrequencies(theme) {
  switch (theme) {
    case 'focus':
      return [196, 293, 392]
    case 'mystic':
      return [174, 261, 349]
    case 'pulse':
      return [220, 330]
    case 'energy':
      return [246, 369, 493]
    default:
      return [200, 300, 400]
  }
}

export function createAmbientLayer({ theme = 'calm', volume = 0.02 } = {}) {
  const ctx = getAudioContext()
  if (!ctx) return null

  let nodes = null
  let running = false

  const buildNodes = () => {
    const gain = ctx.createGain()
    gain.gain.value = 0

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 650

    const oscillators = getAmbientFrequencies(theme).map((frequency, index) => {
      const osc = ctx.createOscillator()
      osc.type = index % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.value = frequency
      osc.connect(filter)
      return osc
    })

    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 0.08
    lfoGain.gain.value = volume * 0.6
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)

    filter.connect(gain)
    gain.connect(ctx.destination)

    nodes = { gain, filter, oscillators, lfo, lfoGain }
  }

  const start = () => {
    const activeCtx = resumeContext()
    if (!activeCtx) return
    if (!nodes) buildNodes()
    if (!nodes || running) return

    nodes.gain.gain.cancelScheduledValues(activeCtx.currentTime)
    nodes.gain.gain.setValueAtTime(0, activeCtx.currentTime)
    nodes.gain.gain.linearRampToValueAtTime(volume, activeCtx.currentTime + 0.4)

    nodes.oscillators.forEach((osc) => osc.start())
    nodes.lfo.start()
    running = true
  }

  const stop = () => {
    if (!nodes || !running) return
    const activeCtx = getAudioContext()
    if (!activeCtx) return

    nodes.gain.gain.cancelScheduledValues(activeCtx.currentTime)
    nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, activeCtx.currentTime)
    nodes.gain.gain.linearRampToValueAtTime(0.0001, activeCtx.currentTime + 0.4)

    const releaseTime = activeCtx.currentTime + 0.45
    nodes.oscillators.forEach((osc) => osc.stop(releaseTime))
    nodes.lfo.stop(releaseTime)

    setTimeout(() => {
      nodes?.oscillators.forEach((osc) => osc.disconnect())
      nodes?.filter.disconnect()
      nodes?.gain.disconnect()
      nodes?.lfo.disconnect()
      nodes?.lfoGain.disconnect()
      nodes = null
      running = false
    }, 600)
  }

  const dispose = () => {
    stop()
  }

  return { start, stop, dispose }
}
