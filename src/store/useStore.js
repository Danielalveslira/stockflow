import { create } from 'zustand'
import * as db from '../lib/db'

export const useStore = create((set, get) => ({
  products: [],
  transactions: [],
  loading: true,
  error: null,

  loadAll: async () => {
    set({ loading: true, error: null })
    try {
      const [products, transactions] = await Promise.all([db.getProducts(), db.getTransactions()])
      set({ products, transactions, loading: false })
    } catch (e) {
      set({ error: 'Erro ao conectar ao banco de dados.', loading: false })
    }
  },

  addProduct: async (data) => {
    const product = await db.insertProduct(data)
    if (product) set((s) => ({ products: [product, ...s.products] }))
  },

  updateProduct: async (id, data) => {
    const product = await db.updateProduct(id, data)
    if (product) set((s) => ({ products: s.products.map((p) => p.id === id ? product : p) }))
  },

  deleteProduct: async (id) => {
    await db.deleteProduct(id)
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }))
  },

  addTransaction: async (data) => {
    const transaction = await db.insertTransaction(data)
    if (transaction) set((s) => ({ transactions: [transaction, ...s.transactions] }))
  },

  deleteTransaction: async (id) => {
    await db.deleteTransaction(id)
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
  },

  addSale: async (items, paymentMethod = 'dinheiro', discount = 0) => {
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0)
    const total = Math.max(0, subtotal - discount)

    const updates = items.map((item) => {
      const product = get().products.find((p) => p.id === item.productId)
      const newQty = Math.max(0, (product?.qty ?? 0) - item.qty)
      return db.updateProduct(item.productId, { ...product, qty: newQty })
    })

    const txPromise = db.insertTransaction({
      type: 'income',
      description: `Venda — ${items.length} item(s)`,
      category: 'Vendas',
      amount: total,
      date: new Date().toISOString().split('T')[0],
      responsible: 'Caixa',
      paymentMethod,
    })

    const [updatedProducts, transaction] = await Promise.all([Promise.all(updates), txPromise])

    if (!transaction) throw new Error('Falha ao registrar transação no banco')

    set((s) => ({
      products: s.products.map((p) => {
        const updated = updatedProducts.find((u) => u?.id === p.id)
        return updated ?? p
      }),
      transactions: [transaction, ...s.transactions],
    }))
  },

  findByBarcode: (code) => get().products.find((p) => p.barcode === code),
}))