import { lazy } from 'react'

/** Leaflet is code-split: wrap in <Suspense fallback={<Loading />}>. */
export const LazyMap = lazy(() => import('./MapView.jsx'))
