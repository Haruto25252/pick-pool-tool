'use client'

import { LanguageProvider } from './LanguageContext'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  )
}
