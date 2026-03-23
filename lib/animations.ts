import type { Variants, Transition } from 'motion/react'

const easeOut: Transition = { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
const spring: Transition = { type: 'spring', stiffness: 380, damping: 30 }

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: easeOut },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: easeOut },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: easeOut },
  exit:    { opacity: 0, x: 16, transition: { duration: 0.15 } },
}

export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

export const shakeError: Variants = {
  animate: { x: [-4, 4, -3, 3, -2, 2, 0], transition: { duration: 0.4 } },
}

export const pulseGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(124,58,237,0)',
      '0 0 0 6px rgba(124,58,237,0.15)',
      '0 0 0 0 rgba(124,58,237,0)',
    ],
    transition: { duration: 1.5, repeat: Infinity },
  },
}

// Hook para respetar prefers-reduced-motion
export function getMotionProps(variants: Variants, reducedMotion: boolean) {
  if (reducedMotion) return {}
  return { variants, initial: 'initial', animate: 'animate', exit: 'exit' }
}
