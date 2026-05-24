import { create } from 'zustand'
import * as db from '../lib/db'

export const useStore = create((set, get) => ({
  products:     [],
  transactions: [],
  suppliers:    [],
  purchases:    [],
  loading: true,
  error:   null,
  settings: { pix_key: '', pix_type: 'phone', pix_name: 'Minha Loja', pix_city: 'Cidade' },

  loadAll: async () => {
    set({ loading: true, error: null })
    try {
      const [products, transactions, suppliers, purchases, settings] = await Promise.all([
        db.getProducts(), db.getTransactions(),
        db.getSuppliers(), db.getPurchases(),
        db.getSettings(),
      ])
      set({ products, transactions, suppliers, purchases, settings, loading: false })
    } catch (e) {
      set({ error: 'Erro ao conectar ao banco de dados.', loading: false })
    }
  },

  /* ── Products ─────────────────────────── */
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

  /* ── Transactions ─────────────────────── */
  addTransaction: async (data) => {
    const t = await db.insertTransaction(data)
    if (t) set((s) => ({ transactions: [t, ...s.transactions] }))
  },
  deleteTransaction: async (id) => {
    await db.deleteTransaction(id)
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
  },

  /* ── Sale ─────────────────────────────── */
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
    if (!transaction) throw new Error('Falha ao registrar transação')

    set((s) => ({
      products: s.products.map((p) => updatedProducts.find((u) => u?.id === p.id) ?? p),
      transactions: [transaction, ...s.transactions],
    }))
  },

  /* ── Suppliers ────────────────────────── */
  addSupplier: async (data) => {
    const s = await db.insertSupplier(data)
    if (s) set((st) => ({ suppliers: [...st.suppliers, s] }))
    return s
  },
  updateSupplier: async (id, data) => {
    const s = await db.updateSupplier(id, data)
    if (s) set((st) => ({ suppliers: st.suppliers.map((x) => x.id === id ? s : x) }))
  },
  deleteSupplier: async (id) => {
    await db.deleteSupplier(id)
    set((s) => ({ suppliers: s.suppliers.filter((x) => x.id !== id) }))
  },

  /* ── Purchases ────────────────────────── */
  addPurchase: async (data) => {
    const p = await db.insertPurchase(data)
    if (p) {
      const full = await db.getPurchases()
      set({ purchases: full })
    }
    return p
  },

  receivePurchase: async (purchaseId) => {
    const purchase = get().purchases.find((p) => p.id === purchaseId)
    if (!purchase) return

    const updated = await db.receivePurchase(purchaseId)
    if (!updated) throw new Error('Erro ao receber compra')

    // Aumenta estoque + recalcula custo médio ponderado
    const items = purchase.items ?? []
    const stockUpdates = items.map(async (item) => {
      if (item.product_id) {
        const product = get().products.find((p) => p.id === item.product_id)
        if (!product) return null

        const qtyAtual    = product.qty
        const custoAtual  = product.cost
        const qtyComprada = item.qty
        const custoCompra = item.cost

        // Custo médio ponderado
        const novoQty   = qtyAtual + qtyComprada
        const novoCusto = novoQty > 0
          ? ((qtyAtual * custoAtual) + (qtyComprada * custoCompra)) / novoQty
          : custoCompra

        return db.updateProduct(item.product_id, {
          ...product,
          qty:  novoQty,
          cost: parseFloat(novoCusto.toFixed(2)),
        })
      } else {
        // Produto digitado manualmente — cria no estoque
        return db.insertProduct({
          name:        item.product_name,
          category:    '',
          responsible: purchase.supplier?.name ?? '',
          qty:         item.qty,
          minQty:      0,
          cost:        item.cost,
          price:       item.cost,
          barcode:     '',
        })
      }
    })

    // Registra despesa no fluxo de caixa
    const txPromise = db.insertTransaction({
      type: 'expense',
      description: `Compra — ${purchase.supplier?.name ?? 'Fornecedor'}`,
      category: 'Compras',
      amount: purchase.total,
      date: new Date().toISOString().split('T')[0],
      responsible: 'Estoque',
      paymentMethod: 'dinheiro',
    })

    const [updatedProducts, transaction] = await Promise.all([
      Promise.all(stockUpdates),
      txPromise,
    ])

    set((s) => {
      const updatedProds = updatedProducts.filter(Boolean)
      const existingIds  = updatedProds.filter((p) => s.products.find((x) => x.id === p.id)).map((p) => p.id)
      const newProds     = updatedProds.filter((p) => !existingIds.includes(p.id))
      return {
        purchases: s.purchases.map((p) => p.id === purchaseId ? { ...p, status: 'received' } : p),
        products: [
          ...s.products.map((p) => updatedProds.find((u) => u?.id === p.id) ?? p),
          ...newProds,
        ],
        transactions: transaction ? [transaction, ...s.transactions] : s.transactions,
      }
    })
  },

  cancelPurchase: async (purchaseId) => {
    await db.cancelPurchase(purchaseId)
    set((s) => ({
      purchases: s.purchases.map((p) => p.id === purchaseId ? { ...p, status: 'cancelled' } : p),
    }))
  },

  updateSetting: async (key, value) => {
    await db.setSetting(key, value)
    set((s) => ({ settings: { ...s.settings, [key]: value } }))
  },

  findByBarcode: (code) => get().products.find((p) => p.barcode === code),
}))