import { useEffect, useMemo, useState } from 'react'

import Button from './Button'
import './TutorialSpotlight.css'

const TOUR_STORAGE_KEY = 'reelshelf-library-tour-completed'

function getSpotlightStyle(rect) {
  if (!rect) {
    return { opacity: 0 }
  }

  return {
    top: `${rect.top - 12}px`,
    left: `${rect.left - 12}px`,
    width: `${rect.width + 24}px`,
    height: `${rect.height + 24}px`,
  }
}

function getTooltipStyle(rect) {
  if (!rect) {
    return { opacity: 0 }
  }

  const spaceBelow = window.innerHeight - rect.bottom
  const prefersBelow = spaceBelow > 240

  return {
    top: prefersBelow ? `${rect.bottom + 20}px` : `${Math.max(24, rect.top - 220)}px`,
    left: `${Math.min(rect.left, window.innerWidth - 360)}px`,
  }
}

function TutorialSpotlight({ steps, enabled, force = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState(null)

  const currentStep = steps[stepIndex]

  useEffect(() => {
    if (enabled && (force || !window.localStorage.getItem(TOUR_STORAGE_KEY))) {
      setStepIndex(0)
      setIsOpen(true)
    }
  }, [enabled, force])

  useEffect(() => {
    if (!isOpen || !currentStep?.targetRef?.current) {
      return undefined
    }

    function updateRect() {
      setRect(currentStep.targetRef.current?.getBoundingClientRect() || null)
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)

    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [currentStep, isOpen])

  const spotlightStyle = useMemo(() => getSpotlightStyle(rect), [rect])
  const tooltipStyle = useMemo(() => getTooltipStyle(rect), [rect])

  function closeTour() {
    window.localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  function goNext() {
    if (stepIndex >= steps.length - 1) {
      closeTour()
      return
    }

    setStepIndex((current) => current + 1)
  }

  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1))
  }

  if (!isOpen || !currentStep) {
    return null
  }

  return (
    <div className="tutorial-spotlight" role="dialog" aria-modal="true" aria-labelledby="tutorial-spotlight-title">
      <button type="button" className="tutorial-spotlight__scrim" aria-label="Cerrar tutorial" onClick={closeTour} />
      <div className="tutorial-spotlight__focus" style={spotlightStyle} />
      <div className="tutorial-spotlight__tooltip" style={tooltipStyle}>
        <span className="tutorial-spotlight__eyebrow">
          Paso {stepIndex + 1} de {steps.length}
        </span>
        <h2 id="tutorial-spotlight-title">{currentStep.title}</h2>
        <p>{currentStep.description}</p>
        <div className="tutorial-spotlight__actions">
          <Button type="button" variant="secondary" onClick={closeTour}>
            Omitir
          </Button>
          <Button type="button" variant="ghost" disabled={stepIndex === 0} onClick={goBack}>
            Atrás
          </Button>
          <Button type="button" onClick={goNext}>
            {stepIndex === steps.length - 1 ? 'Terminar' : 'Siguiente'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TutorialSpotlight
