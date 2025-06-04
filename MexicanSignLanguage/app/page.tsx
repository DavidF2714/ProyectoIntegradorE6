// app/page.tsx
'use client'

import MainHeader from '@/components/MainHeader'
import About from '@/components/About'
import Overview from '@/components/Overview'
import PredictionTool from '@/components/ImagePredictor'

export default function HomePage() {
  return (
    <>
      <MainHeader />
      <PredictionTool />
      <About />
      <Overview />
    </>
  )
}
