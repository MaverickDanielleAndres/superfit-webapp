'use client'

import dynamic from 'next/dynamic'
import RouteLoading from './loading'

const DiaryClientPage = dynamic(() => import('./DiaryClientPage'), {
  ssr: false,
  loading: () => <RouteLoading />,
})

export default function DiaryPage() {
  return <DiaryClientPage />
}
