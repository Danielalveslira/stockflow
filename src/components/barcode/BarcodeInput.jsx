import { useRef, useState } from 'react'
import BarcodeScanner from './BarcodeScanner'

export default function BarcodeInput({ value, onChange, onScan, placeholder = 'Código de barras...' }) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const lastKey = useRef(0)
  const buffer = useRef('')

  const handleKeyDown = (e) => {
    const now = Date.now()
    const delta = now - lastKey.current
    lastKey.current = now

    if (e.key === 'Enter') {
      e.preventDefault()
      // USB scanner: buffer acumulado com teclas rápidas
      // Digitação manual: usa o value do input diretamente
      const code = (buffer.current.length >= 4 && delta < 100)
        ? buffer.current
        : value

      if (code && code.trim().length >= 3) {
        onScan?.(code.trim())
        onChange?.('')
      }
      buffer.current = ''
    } else {
      buffer.current = delta < 60 ? buffer.current + e.key : e.key
    }
  }

  const handleCamera = (code) => {
    setCameraOpen(false)
    onScan?.(code)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M11 5v14"/>
          </svg>
          <input
            className="input"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
          />
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => setCameraOpen(true)}
          title="Escanear com câmera"
          style={{ flexShrink: 0, padding: '8px 12px' }}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      </div>

      {cameraOpen && (
        <BarcodeScanner onScan={handleCamera} onClose={() => setCameraOpen(false)} />
      )}
    </>
  )
}