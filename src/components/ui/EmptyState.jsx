export default function EmptyState({ icon, title, message, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: 12,
      color: 'var(--text-3)', textAlign: 'center',
    }}>
      {icon && (
        <span style={{ opacity: .4, marginBottom: 4 }}>{icon}</span>
      )}
      <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-2)' }}>{title}</p>
      {message && <p style={{ fontSize: 13, maxWidth: 300 }}>{message}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
