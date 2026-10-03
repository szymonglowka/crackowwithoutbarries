import { useEffect } from 'react'

/** Every page must call this: screen-reader users rely on the title after navigation. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · BezProgu` : 'BezProgu'
  }, [title])
}
