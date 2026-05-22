const VARIANTS = {
  success: { bg: 'var(--primary-dim)', color: 'var(--primary)' },
  danger:  { bg: 'var(--danger-dim)',  color: 'var(--danger)'  },
  warning: { bg: 'var(--warning-dim)', color: 'var(--warning)' },
  info:    { bg: 'var(--info-dim)',    color: 'var(--info)'    },
  neutral: { bg: 'var(--bg-3)',        color: 'var(--text-2)'  },
}

export default function Badge({ variant = 'neutral', children }) {
  const s = VARIANTS[variant] ?? VARIANTS.neutral
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 99,
      fontSize: 11, fontWeight: 600, letterSpacing: '.04em',
      background: s.bg, color: s.color,
    }}>
      {children}
    </span>
  )
}
