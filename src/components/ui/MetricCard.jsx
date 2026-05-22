const ACCENT = {
  default: 'var(--primary)',
  success: 'var(--primary)',
  danger:  'var(--danger)',
  warning: 'var(--warning)',
  info:    'var(--info)',
}

export default function MetricCard({ label, value, sub, icon, variant = 'default' }) {
  const color = ACCENT[variant] ?? ACCENT.default
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em' }}>
          {label}
        </span>
        {icon && (
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: color + '22', color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}
