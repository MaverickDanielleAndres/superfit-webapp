'use client'

import dynamic from 'next/dynamic'
import RouteLoading from './loading'

const ExercisesClientPage = dynamic(() => import('./ExercisesClientPage'), {
  ssr: false,
  loading: () => <RouteLoading />,
})

export default function ExercisesPage() {
  return <ExercisesClientPage />
}
