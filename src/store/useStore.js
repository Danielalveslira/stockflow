import { create } from 'zustand'
import * as db from '../lib/db'

export const useStore = create((set, get) => ({
  products:     [],
  transactions: [],
  suppliers:    [],
  purchases:    [],
  customers:    [],
  bills:        [],
  loading: true,
  error:   null,
  settings: { pix_key: '', pix_type: 'phone', pix_name: 'Minha Loja', pix_city: 'Cidade' },

  loadAll: async () => {
    set({ loading: true, error: null })
    try {
      const [products, transactions, suppliers, purchases, customers, bills, settings] = await Promise.all([
        db.getProducts(), db.getTransactions(),
        db.getSuppliers(), db.getPurchases(),
        db.getCustomers(), db.getBills(),
        db.getSettings(),
      ])
      set({ products, transactions, suppliers, purchases, customers, bills, settings, loading: false })
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
      type: 'income', description: `Venda — ${items.length} item(s)`,
      category: 'Vendas', amount: total,
      date: new Date().toISOString().split('T')[0],
      responsible: 'Caixa', paymentMethod,
    })
    const [updatedProducts, transaction] = await Promise.all([Promise.all(updates), txPromise])
    if (!transaction) throw new Error('Falha ao registrar transação')
    set((s) => ({
      products: s.products.map((p) => updatedProducts.find((u) => u?.id === p.id) ?? p),
      transactions: [transaction, ...s.transactions],
    }))
  },

  /* ── Fiado ────────────────────────────── */
  addFiado: async (items, customerId, discount = 0) => {
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0)
    const total = Math.max(0, subtotal - discount)
    const customer = get().customers.find((c) => c.id === customerId)

    // Desconta estoque
    const updates = items.map((item) => {
      const product = get().products.find((p) => p.id === item.productId)
      const newQty = Math.max(0, (product?.qty ?? 0) - item.qty)
      return db.updateProduct(item.productId, { ...product, qty: newQty })
    })

    // Monta descrição com nomes dos produtos
    const itemsSummary = items
      .map((i) => `${i.name}${i.qty > 1 ? ' x' + i.qty : ''}`)
      .join(', ')

    // Registra dívida
    const debtPromise = db.insertDebt({
      customerId, amount: total,
      description: itemsSummary,
      saleDate: new Date().toISOString().split('T')[0],
    })

    const [updatedProducts, debt] = await Promise.all([Promise.all(updates), debtPromise])
    if (!debt) throw new Error('Falha ao registrar fiado')

    set((s) => ({
      products:  s.products.map((p) => updatedProducts.find((u) => u?.id === p.id) ?? p),
      customers: s.customers.map((c) => c.id === customerId
        ? { ...c, debts: [...(c.debts ?? []), debt] }
        : c
      ),
    }))
  },

  /* ── Customers ────────────────────────── */
  addCustomer: async (data) => {
    const c = await db.insertCustomer(data)
    if (c) set((s) => ({ customers: [...s.customers, { ...c, debts: [] }] }))
    return c
  },
  updateCustomer: async (id, data) => {
    const c = await db.updateCustomer(id, data)
    if (c) set((s) => ({ customers: s.customers.map((x) => x.id === id ? { ...x, ...c } : x) }))
  },
  deleteCustomer: async (id) => {
    await db.deleteCustomer(id)
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }))
  },
  payDebt: async (debtId, paidAmount, customerId) => {
    const customer  = get().customers.find((c) => c.id === customerId)
    const debtObj   = (customer?.debts ?? []).find((d) => d.id === debtId)
    const remaining = (debtObj?.amount ?? 0) - (debtObj?.paid_amount ?? 0)
    const isPaid    = paidAmount >= remaining

    const debt = await db.payDebt(debtId, paidAmount, remaining)
    if (!debt) return

    // Registra receita no Fluxo de Caixa
    const tx = await db.insertTransaction({
      type:          'income',
      description:   `Fiado recebido — ${customer?.name ?? 'Cliente'}${!isPaid ? ' (parcial)' : ''}`,
      category:      'Fiado',
      amount:        paidAmount,
      date:          new Date().toISOString().split('T')[0],
      responsible:   'Caixa',
      paymentMethod: 'dinheiro',
    })
    if (tx) set((s) => ({ transactions: [tx, ...s.transactions] }))

    set((s) => ({
      customers: s.customers.map((c) => c.id === customerId
        ? { ...c, debts: (c.debts ?? []).map((d) => d.id === debtId ? debt : d) }
        : c
      ),
    }))
  },

  /* ── Bills ────────────────────────────── */
  addBill: async (data) => {
    const bill = await db.insertBill(data)
    if (bill) set((s) => ({ bills: [...s.bills, bill].sort((a, b) => a.due_date.localeCompare(b.due_date)) }))
  },
  payBill: async (billId, amount) => {
    const bill = await db.payBill(billId, amount)
    if (!bill) return
    // Insere a transação de despesa diretamente no estado (sem recarregar tudo)
    const targetBill = get().bills.find((b) => b.id === billId)
    if (targetBill) {
      const tx = await db.insertTransaction({
        type: 'expense', description: targetBill.description,
        category: targetBill.category, amount: targetBill.amount,
        date: new Date().toISOString().split('T')[0],
        responsible: 'Contas', paymentMethod: 'dinheiro',
      })
      set((s) => ({
        bills: s.bills.map((b) => b.id === billId ? { ...b, status: 'paid' } : b),
        transactions: tx ? [tx, ...s.transactions] : s.transactions,
      }))
    }
  },
  deleteBill: async (id) => {
    await db.deleteBill(id)
    set((s) => ({ bills: s.bills.filter((b) => b.id !== id) }))
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
    if (p) { const full = await db.getPurchases(); set({ purchases: full }) }
    return p
  },
  receivePurchase: async (purchaseId) => {
    const purchase = get().purchases.find((p) => p.id === purchaseId)
    if (!purchase) return
    const updated = await db.receivePurchase(purchaseId)
    if (!updated) throw new Error('Erro ao receber compra')
    const items = purchase.items ?? []
    const stockUpdates = items.map(async (item) => {
      if (item.product_id) {
        const product = get().products.find((p) => p.id === item.product_id)
        if (!product) return null
        const novoQty   = product.qty + item.qty
        const novoCusto = novoQty > 0
          ? ((product.qty * product.cost) + (item.qty * item.cost)) / novoQty
          : item.cost
        return db.updateProduct(item.product_id, { ...product, qty: novoQty, cost: parseFloat(novoCusto.toFixed(2)) })
      } else {
        return db.insertProduct({
          name: item.product_name, category: '', responsible: purchase.supplier?.name ?? '',
          qty: item.qty, minQty: 0, cost: item.cost, price: item.cost, barcode: '',
        })
      }
    })
    const txPromise = db.insertTransaction({
      type: 'expense', description: `Compra — ${purchase.supplier?.name ?? 'Fornecedor'}`,
      category: 'Compras', amount: purchase.total,
      date: new Date().toISOString().split('T')[0],
      responsible: 'Estoque', paymentMethod: 'dinheiro',
    })
    const [updatedProducts, transaction] = await Promise.all([Promise.all(stockUpdates), txPromise])
    set((s) => {
      const all = updatedProducts.filter(Boolean)
      const existingIds = all.filter((p) => s.products.find((x) => x.id === p.id)).map((p) => p.id)
      const newProds    = all.filter((p) => !existingIds.includes(p.id))
      return {
        purchases: s.purchases.map((p) => p.id === purchaseId ? { ...p, status: 'received' } : p),
        products: [...s.products.map((p) => all.find((u) => u?.id === p.id) ?? p), ...newProds],
        transactions: transaction ? [transaction, ...s.transactions] : s.transactions,
      }
    })
  },
  cancelPurchase: async (purchaseId) => {
    await db.cancelPurchase(purchaseId)
    set((s) => ({ purchases: s.purchases.map((p) => p.id === purchaseId ? { ...p, status: 'cancelled' } : p) }))
  },

  /* ── Settings ─────────────────────────── */
  updateSetting: async (key, value) => {
    await db.setSetting(key, value)
    set((s) => ({ settings: { ...s.settings, [key]: value } }))
  },

  findByBarcode: (code) => get().products.find((p) => p.barcode === code),
}))