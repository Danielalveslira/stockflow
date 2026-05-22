import { useEffect, useRef, useState } from 'react'
import Modal from '../ui/Modal'

/**
 * Modal de câmera usando @zxing/browser.
 * Detecta qualquer formato de barcode/QR Code.
 */
export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const start = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (!active) return

        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (!active) return
          if (result) {
            onScan(result.getText())
          }
        })
        setLoading(false)
      } catch (e) {
        if (active) setError('Não foi possível acessar a câmera. Verifique as permissões.')
        setLoading(false)
      }
    }

    start()

    return () => {
      active = false
      try { readerRef.current?.reset() } catch (_) {}
    }
  }, [onScan])

  return (
    <Modal open onClose={onClose} title="Escanear código de barras" width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error ? (
          <div style={{
            padding: 20, background: 'var(--danger-dim)', color: 'var(--danger)',
            borderRadius: 8, fontSize: 13, textAlign: 'center',
          }}>
            {error}
          </div>
        ) : (
          <div style={{ position: 'relative', background: '#000', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {loading && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: '#00000080', color: '#fff', fontSize: 13,
              }}>
                Iniciando câmera...
              </div>
            )}
            {/* Mira */}
            {!loading && (
              <div style={{
                position: 'absolute', inset: '20%',
                border: '2px solid var(--primary)',
                borderRadius: 8, boxShadow: '0 0 0 9999px #00000050',
                pointerEvents: 'none',
              }} />
            )}
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
          Aponte a câmera para o código de barras ou QR Code
        </p>
      </div>
    </Modal>
  )
}
