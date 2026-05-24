/**
 * Calcula métricas avançadas de estoque a partir de produtos e transações.
 */

/* ── Classificação ABC ───────────────────────────────────────────
 * A = produtos que representam ~80% da receita total
 * B = ~15%
 * C = ~5%
 */
export function calcABC(products, transactions) {
  const salesByProduct = {}

  transactions
    .filter((t) => t.type === 'income' && t.category === 'Vendas')
    .forEach((t) => {
      // Não temos product_id nas transações, então usamos aproximação pelo nome
      // O ideal futuro seria guardar product_id na venda
    })

  // Fallback: classifica pelo valor em estoque (qty × price)
  const totalRevenue = products.reduce((s, p) => s + p.qty * p.price, 0)
  const sorted = [...products].sort((a, b) => b.qty * b.price - a.qty * a.price)

  let cumulative = 0
  return sorted.reduce((map, p) => {
    const share = totalRevenue > 0 ? (p.qty * p.price) / totalRevenue : 0
    cumulative += share
    map[p.id] = cumulative <= 0.8 ? 'A' : cumulative <= 0.95 ? 'B' : 'C'
    return map
  }, {})
}

/* ── Giro de estoque ─────────────────────────────────────────────
 * giro = unidades vendidas no período ÷ estoque médio
 * Alto giro = produto saudável; baixo giro = produto parado
 */
export function calcTurnover(products, transactions, days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  // Agrupa vendas por data e tenta estimar por produto
  // Como não temos product_id nas transações de venda, estimamos
  // pelo total de receita proporcional ao preço de cada produto
  const totalSales = transactions
    .filter((t) => t.type === 'income' && t.category === 'Vendas' && new Date(t.date) >= cutoff)
    .reduce((s, t) => s + t.amount, 0)

  return products.reduce((map, p) => {
    const avgStock = Math.max(p.qty, 1)
    // Estimativa: se o produto representa X% do valor do estoque,
    // provavelmente gerou X% das vendas
    const totalStockValue = products.reduce((s, x) => s + x.qty * x.price, 0)
    const share = totalStockValue > 0 ? (p.qty * p.price) / totalStockValue : 0
    const estimatedSalesQty = p.price > 0 ? (totalSales * share) / p.price : 0
    const turnover = estimatedSalesQty / avgStock

    map[p.id] = parseFloat(turnover.toFixed(2))
    return map
  }, {})
}

/* ── Ponto de reposição ──────────────────────────────────────────
 * reorder_point = consumo_médio_diário × lead_time_days + estoque_segurança
 * estoque_segurança = minQty
 */
export function calcReorderPoint(product, transactions, days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  // Estima consumo diário a partir do total de vendas do período
  const totalSales = transactions
    .filter((t) => t.type === 'income' && t.category === 'Vendas' && new Date(t.date) >= cutoff)
    .reduce((s, t) => s + t.amount, 0)

  const totalStockValue = 0 // não temos product_id nas vendas
  // Estimativa conservadora: assume consumo com base no minQty
  const avgDailyConsumption = product.minQty / 7 || 1
  const leadTime = product.leadTimeDays ?? 3
  const safetyStock = product.minQty ?? 0

  return Math.ceil(avgDailyConsumption * leadTime + safetyStock)
}

/* ── Previsão de demanda ─────────────────────────────────────────
 * Usa média móvel simples das vendas dos últimos 30 dias
 * Retorna quantidade sugerida para o próximo pedido (30 dias)
 */
export function calcForecast(product, transactions) {
  const now = new Date()
  const last30 = new Date(now)
  last30.setDate(last30.getDate() - 30)
  const prev30 = new Date(now)
  prev30.setDate(prev30.getDate() - 60)

  // Como não temos product_id nas transações, usamos o minQty como base
  // e ajustamos pela sazonalidade dos últimos 30 dias vs anteriores
  const recentSales = transactions
    .filter((t) => t.type === 'income' && t.category === 'Vendas' && new Date(t.date) >= last30)
    .length

  const prevSales = transactions
    .filter((t) => t.type === 'income' && t.category === 'Vendas' && new Date(t.date) >= prev30 && new Date(t.date) < last30)
    .length

  // Crescimento em relação ao período anterior
  const growthFactor = prevSales > 0 ? recentSales / prevSales : 1

  // Quantidade sugerida: baseada no minQty × 2 ajustado pelo fator de crescimento
  const base = Math.max(product.minQty * 2, product.qty + product.minQty)
  return Math.ceil(base * Math.min(growthFactor, 2))
}

/* ── Alerta de validade ──────────────────────────────────────────
 * Retorna { status, daysLeft }
 * status: 'expired' | 'critical' (≤7 dias) | 'warning' (≤30 dias) | 'ok'
 */
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0)   return { status: 'expired',  daysLeft, label: 'Vencido'      }
  if (daysLeft <= 7)  return { status: 'critical',  daysLeft, label: `${daysLeft}d` }
  if (daysLeft <= 30) return { status: 'warning',   daysLeft, label: `${daysLeft}d` }
  return { status: 'ok', daysLeft, label: `${daysLeft}d` }
}