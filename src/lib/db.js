import { supabase } from './supabase'

const toProduct = (r) => r && ({
  id: r.id, name: r.name, category: r.category ?? '',
  responsible: r.responsible ?? '', qty: r.qty ?? 0,
  minQty: r.min_qty ?? 0, cost: Number(r.cost ?? 0),
  price: Number(r.price ?? 0), barcode: r.barcode ?? '',
  createdAt: r.created_at,
})

const fromProduct = (d) => ({
  name: d.name, category: d.category ?? '',
  responsible: d.responsible ?? '', qty: d.qty ?? 0,
  min_qty: d.minQty ?? 0, cost: d.cost ?? 0,
  price: d.price ?? 0, barcode: d.barcode ?? '',
  expiry_date: d.expiryDate ?? null, lead_time_days: d.leadTimeDays ?? 3,
})

const toTransaction = (r) => r && ({
  id: r.id, type: r.type, description: r.description,
  category: r.category ?? '', amount: Number(r.amount),
  date: r.date, responsible: r.responsible ?? '',
  paymentMethod: r.payment_method ?? 'dinheiro',
  createdAt: r.created_at,
})

const fromTransaction = (d) => ({
  type: d.type, description: d.description,
  category: d.category ?? '', amount: d.amount,
  date: d.date, responsible: d.responsible ?? '',
  payment_method: d.paymentMethod ?? 'dinheiro',
})

export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (error) { console.error('[db] getProducts:', error.message); return [] }
  return data.map(toProduct)
}

export async function insertProduct(product) {
  const { data, error } = await supabase.from('products').insert(fromProduct(product)).select().single()
  if (error) { console.error('[db] insertProduct:', error.message); return null }
  return toProduct(data)
}

export async function updateProduct(id, product) {
  const { data, error } = await supabase.from('products').update(fromProduct(product)).eq('id', id).select().single()
  if (error) { console.error('[db] updateProduct:', error.message); return null }
  return toProduct(data)
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) console.error('[db] deleteProduct:', error.message)
}

export async function getTransactions() {
  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false })
  if (error) { console.error('[db] getTransactions:', error.message); return [] }
  return data.map(toTransaction)
}

export async function insertTransaction(transaction) {
  const { data, error } = await supabase.from('transactions').insert(fromTransaction(transaction)).select().single()
  if (error) { console.error('[db] insertTransaction:', error.message); return null }
  return toTransaction(data)
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) console.error('[db] deleteTransaction:', error.message)
}

// ── Suppliers ─────────────────────────────────────────

export async function getSuppliers() {
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) { console.error('[db] getSuppliers:', error.message); return [] }
  return data
}

export async function insertSupplier(s) {
  const { data, error } = await supabase.from('suppliers')
    .insert({ name: s.name, phone: s.phone??'', email: s.email??'', cnpj: s.cnpj??'', notes: s.notes??'' })
    .select().single()
  if (error) { console.error('[db] insertSupplier:', error.message); return null }
  return data
}

export async function updateSupplier(id, s) {
  const { data, error } = await supabase.from('suppliers')
    .update({ name: s.name, phone: s.phone??'', email: s.email??'', cnpj: s.cnpj??'', notes: s.notes??'' })
    .eq('id', id).select().single()
  if (error) { console.error('[db] updateSupplier:', error.message); return null }
  return data
}

export async function deleteSupplier(id) {
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) console.error('[db] deleteSupplier:', error.message)
}

// ── Purchases ─────────────────────────────────────────

export async function getPurchases() {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, supplier:suppliers(id,name), items:purchase_items(*, product:products(id,name))')
    .order('date', { ascending: false })
  if (error) { console.error('[db] getPurchases:', error.message); return [] }
  return data
}

export async function insertPurchase({ supplierId, date, notes, items }) {
  const total = items.reduce((s, i) => s + i.qty * i.cost, 0)
  const { data: purchase, error } = await supabase.from('purchases')
    .insert({ supplier_id: supplierId||null, date, notes: notes??'', total, status: 'pending' })
    .select().single()
  if (error) { console.error('[db] insertPurchase:', error.message); return null }

  const rows = items.map((i) => ({
    purchase_id: purchase.id,
    product_id: i.productId || null,
    product_name: i.productName,
    qty: i.qty,
    cost: i.cost,
  }))
  await supabase.from('purchase_items').insert(rows)
  return purchase
}

export async function receivePurchase(purchaseId) {
  const { data, error } = await supabase.from('purchases')
    .update({ status: 'received', received_at: new Date().toISOString() })
    .eq('id', purchaseId).select('*, items:purchase_items(*)').single()
  if (error) { console.error('[db] receivePurchase:', error.message); return null }
  return data
}

export async function cancelPurchase(purchaseId) {
  const { error } = await supabase.from('purchases')
    .update({ status: 'cancelled' }).eq('id', purchaseId)
  if (error) console.error('[db] cancelPurchase:', error.message)
}

// ── Store Settings ────────────────────────────────────

export async function getSettings() {
  const { data, error } = await supabase.from('store_settings').select('*')
  if (error) { console.error('[db] getSettings:', error.message); return {} }
  return data.reduce((map, row) => { map[row.key] = row.value; return map }, {})
}

export async function setSetting(key, value) {
  const { error } = await supabase
    .from('store_settings')
    .upsert({ key, value }, { onConflict: 'key' })
  if (error) console.error('[db] setSetting:', error.message)
}