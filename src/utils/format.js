/** Formata valor em BRL */
export const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

/** Formata data pt-BR */
export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** Margem em % */
export const calcMargin = (cost, price) => {
  if (!cost || !price || price === 0) return 0
  return (((price - cost) / price) * 100).toFixed(1)
}

/** ID único simples */
export const uid = () => Math.random().toString(36).slice(2, 10)
