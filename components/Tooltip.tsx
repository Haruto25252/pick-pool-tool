'use client'

import { useState, useRef, ReactNode } from 'react'

type TooltipProps = {
  text: string
  children: ReactNode
  position?: 'top' | 'bottom'
  align?: 'left' | 'center' | 'right'
  zIndex?: string
}

export function Tooltip({ text, children, position = 'top', align = 'center', zIndex = 'z-20' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setVisible(true)
  }

  const hide = () => setVisible(false)

  const handleTouchStart = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    pressTimer.current = setTimeout(() => setVisible(true), 500)
  }

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    if (visible) {
      hideTimer.current = setTimeout(() => setVisible(false), 2000)
    }
  }

  const handleTouchCancel = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    setVisible(false)
  }

  const posClass = position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
  const alignClass =
    align === 'left' ? 'left-0' :
    align === 'right' ? 'right-0' :
    'left-1/2 -translate-x-1/2'

  if (!text) return <>{children}</>

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
      <div className={`absolute ${posClass} ${alignClass} px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap transition-opacity pointer-events-none ${zIndex} ${visible ? 'opacity-100' : 'opacity-0'}`}>
        {text}
      </div>
    </div>
  )
}
