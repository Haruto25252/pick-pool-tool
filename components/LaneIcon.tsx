const CDN = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions'

const POSITION_ICONS: Record<string, string> = {
  TOP: `${CDN}/icon-position-top.png`,
  JUNGLE: `${CDN}/icon-position-jungle.png`,
  MID: `${CDN}/icon-position-middle.png`,
  ADC: `${CDN}/icon-position-bottom.png`,
  SUPPORT: `${CDN}/icon-position-utility.png`,
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
