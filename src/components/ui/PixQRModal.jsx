import { useEffect, useRef, useState } from 'react'
import { buildPixPayload } from '../../utils/pixPayload'
import { fmt } from '../../utils/format'

export default function PixQRModal({ amount, settings, onClose, onConfirm }) {
  const canvasRef = useRef(null)
  const [payload, setPayload]   = useState('')
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState(false)

  const { pix_key, pix_type, pix_name, pix_city } = settings

  useEffect(() => {
    if (!pix_key) {
      setError('Chave PIX não configurada. Vá em Ajustes para configurar.')
      return
    }

    try {
      const p = buildPixPayload({
        pixKey:  pix_key,
        pixType: pix_type || 'phone',
        name:    pix_name || 'Loja',
        city:    pix_city || 'Cidade',
        amount,
        txid:    Date.now().toString().slice(-10),
      })
      setPayload(p)

      const render = async () => {
        const QRCode = (await import('qrcode')).default
        await QRCode.toCanvas(canvasRef.current, p, {
          width:     280,
          margin:    2,
          color:     { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        })
      }
      render()
    } catch (e) {
      setError(e.message)
    }
  }, [amount, pix_key, pix_name, pix_city])

  const handleCopy = () => {
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#00000075',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px 28px 24px',
        width: 360, boxShadow: 'var(--shadow)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>

        {/* Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* PIX logo color */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#32BCAD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Pagar com PIX</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Valor */}
        <div style={{
          background: 'var(--bg-3)', borderRadius: 10,
          padding: '12px 24px', textAlign: 'center', width: '100%',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 500 }}>
            Valor a pagar
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#32BCAD', fontFamily: 'DM Mono, monospace' }}>
            {fmt(amount)}
          </p>
        </div>

        {/* QR Code ou erro */}
        {error ? (
          <div style={{
            background: 'var(--danger-dim)', color: 'var(--danger)',
            borderRadius: 10, padding: '14px 18px', fontSize: 13,
            textAlign: 'center', width: '100%', lineHeight: 1.5,
          }}>
            {error}
          </div>
        ) : (
          <div style={{
            background: '#fff', borderRadius: 12, padding: 10,
            boxShadow: '0 2px 12px #00000020',
          }}>
            <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 6 }} />
          </div>
        )}

        {/* Chave PIX */}
        {pix_key && !error && (
          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
            Chave PIX: <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{pix_key}</span>
          </p>
        )}

        {/* Copia e cola */}
        {payload && !error && (
          <button
            onClick={handleCopy}
            style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: copied ? 'var(--primary-dim)' : 'var(--bg-3)',
              color: copied ? 'var(--primary)' : 'var(--text-2)',
              border: `1px solid ${copied ? 'var(--primary)' : 'var(--border)'}`,
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .2s',
            }}>
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copiar código PIX
              </>
            )}
          </button>
        )}

        {/* Confirmar recebimento */}
        <button
          className="btn btn-primary"
          onClick={onConfirm}
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Confirmar pagamento recebido
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>
          Verifique no seu app bancário que o valor de {fmt(amount)} foi recebido antes de confirmar.
        </p>
      </div>
    </div>
  )
}