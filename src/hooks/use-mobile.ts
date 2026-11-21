import { useSyncExternalStore } from 'react'

const desktopQuery = '(min-width: 48rem)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(desktopQuery)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSnapshot() {
  return !window.matchMedia(desktopQuery).matches
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
