/** Instância reutilizada do formatador BRL (evita recriar a cada chamada) */
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const DATE_FMT = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** Formata valor em BRL */
export const fmt = (v) => BRL.format(v ?? 0)

/** Formata data pt-BR */
export const fmtDate = (iso) => DATE_FMT.format(new Date(iso))

/** Margem em % */
export const calcMargin = (cost, price) => {
  if (!cost || !price || price === 0) return 0
  return (((price - cost) / price) * 100).toFixed(1)
}