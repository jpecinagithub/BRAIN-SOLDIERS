import { useEffect, useRef } from 'react'
import { createAmbientLayer } from './audioEngine'

export function useAmbientAudio({ theme = 'calm', volume = 0.02 } = {}) {
  const ambientRef = useRef(null)

  useEffect(() => {
    return () => {
      if (ambientRef.current) {
        ambientRef.current.dispose()
        ambientRef.current = null
      }
    }
  }, [])

  const startAmbient = () => {
    if (!ambientRef.current) {
      ambientRef.current = createAmbientLayer({ theme, volume })
    }
    ambientRef.current?.start()
  }

  const stopAmbient = () => {
    ambientRef.current?.stop()
  }

  return { startAmbient, stopAmbient }
}
