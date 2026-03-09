const POSITION_ICONS: Record<string, string> = {
  TOP: 'https://ddragon.leagueoflegends.com/cdn/img/position/Position_Challenger-Top.png',
  JUNGLE: 'https://ddragon.leagueoflegends.com/cdn/img/position/Position_Challenger-Jungle.png',
  MID: 'https://ddragon.leagueoflegends.com/cdn/img/position/Position_Challenger-Mid.png',
  ADC: 'https://ddragon.leagueoflegends.com/cdn/img/position/Position_Challenger-Bottom.png',
  SUPPORT: 'https://ddragon.leagueoflegends.com/cdn/img/position/Position_Challenger-Support.png',
}

type LaneIconProps = {
  lane: string
  size?: number
  className?: string
}

export function LaneIcon({ lane, size = 20, className = '' }: LaneIconProps) {
  const url = POSITION_ICONS[lane]

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={lane}
        width={size}
        height={size}
        className={className}
        draggable={false}
      />
    )
  }

  // 全て (Fill): asterisk SVG
  if (lane === '全て') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden
      >
        <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }

  return null
}
