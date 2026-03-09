type LaneIconProps = {
  lane: string
  size?: number
  className?: string
}

export function LaneIcon({ lane, size = 20, className = '' }: LaneIconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    className,
    'aria-hidden': true as const,
  }

  switch (lane) {
    case 'TOP':
      // Square outline (top lane tower/structure)
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <rect x="8" y="8" width="8" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      )
    case 'JUNGLE':
      // Two diagonal V-shapes (leaves/crossed paths)
      return (
        <svg {...props}>
          <path d="M4 3L12 12L4 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 3L12 12L20 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'MID':
      // Diamond/rotated square outline
      return (
        <svg {...props}>
          <path d="M12 3L21 12L12 21L3 12Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      )
    case 'ADC':
      // Diamond with small diamond ornaments at each corner
      return (
        <svg {...props}>
          <path d="M12 7L17 12L12 17L7 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 2L13.5 4L12 6L10.5 4Z" fill="currentColor" />
          <path d="M18 12L20 10.5L22 12L20 13.5Z" fill="currentColor" />
          <path d="M12 18L13.5 20L12 22L10.5 20Z" fill="currentColor" />
          <path d="M6 12L4 10.5L2 12L4 13.5Z" fill="currentColor" />
        </svg>
      )
    case 'SUPPORT':
      // Wing/guardian shape
      return (
        <svg {...props}>
          <path
            d="M12 20C12 20 3.5 15.5 3.5 9.5C3.5 7 5 5 7 5C9 5 10.5 6.5 12 8.5C13.5 6.5 15 5 17 5C19 5 20.5 7 20.5 9.5C20.5 15.5 12 20 12 20Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M12 8.5L12 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case '全て':
      // Asterisk (Fill - all positions)
      return (
        <svg {...props}>
          <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}
