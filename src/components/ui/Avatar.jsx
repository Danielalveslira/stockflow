const COLORS = ['#00d68f','#5b8af0','#f5a623','#ff5f5f','#a78bfa']

function hashColor(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return COLORS[h % COLORS.length]
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

export default function Avatar({ name = '', size = 30 }) {
  const color = hashColor(name)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: color + '22', color, border: `1px solid ${color}44`,
      fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
    }}>
      {initials(name)}
    </span>
  )
}
