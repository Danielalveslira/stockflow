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