import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../utils/format'

const SAMPLE_PRODUCTS = [
  { id: uid(), name: 'Coca-Cola 2L', category: 'Bebidas', responsible: 'Ana Lima', qty: 48, minQty: 10, cost: 7.5, price: 12.99, barcode: '7894900011517', createdAt: '2024-01-10' },
  { id: uid(), name: 'Pão de Forma', category: 'Padaria', responsible: 'Carlos Melo', qty: 8, minQty: 10, cost: 4.2, price: 7.49, barcode: '7891962057620', createdAt: '2024-01-15' },
  { id: uid(), name: 'Arroz 5kg', category: 'Grãos', responsible: 'Ana Lima', qty: 0, minQty: 5, cost: 18, price: 28.90, barcode: '7896006716081', createdAt: '2024-02-01' },
  { id: uid(), name: 'Feijão Carioca 1kg', category: 'Grãos', responsible: 'João Silva', qty: 15, minQty: 5, cost: 6.5, price: 9.99, barcode: '7896005801018', createdAt: '2024-02-10' },
]

const SAMPLE_TRANSACTIONS = [
  { id: uid(), type: 'income', description: 'Venda - 3 item(s)', category: 'Vendas', amount: 39.47, date: '2024-03-01', responsible: 'Caixa' },
  { id: uid(), type: 'expense', description: 'Reposição de estoque', category: 'Compras', amount: 180, date: '2024-03-03', responsible: 'João Silva' },
  { id: uid(), type: 'income', description: 'Venda - 5 item(s)', category: 'Vendas', amount: 67.90, date: '2024-03-05', responsible: 'Caixa' },
  { id: uid(), type: 'expense', description: 'Aluguel', category: 'Operacional', amount: 800, date: '2024-03-07', responsible: 'Carlos Melo' },
  { id: uid(), type: 'income', description: 'Venda - 2 item(s)', category: 'Vendas', amount: 22.48, date: '2024-03-08', responsible: 'Caixa' },
]

export const useStore = create(
  persist(
    (set, get) => ({
      products: SAMPLE_PRODUCTS,
      transactions: SAMPLE_TRANSACTIONS,

      /* ── PRODUCTS ─────────────────────────── */
      addProduct: (data) =>
        set((s) => ({ products: [...s.products, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),

      updateProduct: (id, data) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p)) })),

      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      /* ── TRANSACTIONS ─────────────────────── */
      addTransaction: (data) =>
        set((s) => ({ transactions: [...s.transactions, { ...data, id: uid() }] })),

      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      /* ── SALE ─────────────────────────────── */
      // items: [{ productId, name, qty, price }]
      addSale: (items) =>
        set((s) => {
          const total = items.reduce((sum, i) => sum + i.qty * i.price, 0)

          const products = s.products.map((p) => {
            const item = items.find((i) => i.productId === p.id)
            if (!item) return p
            return { ...p, qty: Math.max(0, p.qty - item.qty) }
          })

          const transaction = {
            id: uid(),
            type: 'income',
            description: `Venda - ${items.length} item(s)`,
            category: 'Vendas',
            amount: total,
            date: new Date().toISOString().split('T')[0],
            responsible: 'Caixa',
          }

          return { products, transactions: [...s.transactions, transaction] }
        }),

      /* ── HELPERS ──────────────────────────── */
      findByBarcode: (code) =>
        get().products.find((p) => p.barcode === code),
    }),
    { name: 'stockflow-v1' }
  )
)
