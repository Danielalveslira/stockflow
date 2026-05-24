import { useState } from 'react'
import { useStore } from '../store/useStore'
import PageHeader from '../components/layout/PageHeader'
import { PIX_TYPES, validatePixKey, maskCPF, maskCNPJ, maskPhone, buildPixPayload } from '../utils/pixPayload'
import { fmt } from '../utils/format'

function Field({ label, hint, error, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
    </div>
  )
}

export default function Settings() {
  const settings      = useStore((s) => s.settings)
  const updateSetting = useStore((s) => s.updateSetting)

  const [pixType, setPixType] = useState(settings.pix_type ?? 'phone')
  const [pixKey,  setPixKey]  = useState(settings.pix_key  ?? '')
  const [pixName, setPixName] = useState(settings.pix_name ?? '')
  const [pixCity, setPixCity] = useState(settings.pix_city ?? '')
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [testResult, setTestResult] = useState(null)

  /* ── Máscara dinâmica conforme tipo ── */
  const handleKeyChange = (raw) => {
    let masked = raw
    if (pixType === 'cpf')   masked = maskCPF(raw)
    if (pixType === 'cnpj')  masked = maskCNPJ(raw)
    if (pixType === 'phone') masked = maskPhone(raw)
    setPixKey(masked)
    setErrors((e) => ({ ...e, pix_key: undefined }))
  }

  const handleTypeChange = (type) => {
    setPixType(type)
    setPixKey('')
    setErrors({})
    setTestResult(null)
  }

  /* ── Validação ── */
  const validate = () => {
    const errs = {}
    const kv = validatePixKey(pixKey, pixType)
    if (!kv.valid) errs.pix_key = kv.error
    if (!pixName.trim()) errs.pix_name = 'Obrigatório'
    if (!pixCity.trim()) errs.pix_city = 'Obrigatório'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    await Promise.all([
      updateSetting('pix_type', pixType),
      updateSetting('pix_key',  pixKey.trim()),
      updateSetting('pix_name', pixName.trim()),
      updateSetting('pix_city', pixCity.trim()),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleTest = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      const payload = buildPixPayload({
        pixKey, pixType,
        name: pixName, city: pixCity,
        amount: 1.00, txid: 'TESTE',
      })
      setTestResult({ ok: true, payload })
    } catch (e) {
      setTestResult({ ok: false, message: e.message })
    }
  }

  const currentType = PIX_TYPES.find((t) => t.value === pixType)

  return (
    <div className="page">
      <PageHeader title="Ajustes" subtitle="Configurações da loja" />

      <div style={{ maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div className="card">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#32BCAD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontWeight: 600, fontSize: 15 }}>Configuração do PIX</p>
          </div>

          {/* Tipo de chave */}
          <div className="field" style={{ marginBottom: 18 }}>
            <label>Tipo de chave PIX</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {PIX_TYPES.map((t) => (
                <button key={t.value} onClick={() => handleTypeChange(t.value)}
                  style={{
                    padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', border: 'none', textAlign: 'center',
                    background: pixType === t.value ? 'var(--primary)' : 'var(--bg-3)',
                    color:      pixType === t.value ? '#000'           : 'var(--text-2)',
                    transition: 'all .15s',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chave PIX */}
          <Field
            label="Chave PIX"
            hint={currentType?.hint}
            error={errors.pix_key}
          >
            <input
              className={`input ${errors.pix_key ? 'input-error' : ''}`}
              value={pixKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder={currentType?.placeholder ?? ''}
              autoComplete="off"
            />
          </Field>

          <div style={{ height: 14 }} />

          <div className="grid-2">
            <Field label="Nome da loja *" hint="Aparece no app do cliente (máx 25 chars)" error={errors.pix_name}>
              <input
                className={`input ${errors.pix_name ? 'input-error' : ''}`}
                value={pixName} onChange={(e) => setPixName(e.target.value)}
                maxLength={25} placeholder="Ex: Mercadinho Joao"
              />
            </Field>
            <Field label="Cidade *" hint="Sem acentos (máx 15 chars)" error={errors.pix_city}>
              <input
                className={`input ${errors.pix_city ? 'input-error' : ''}`}
                value={pixCity} onChange={(e) => setPixCity(e.target.value)}
                maxLength={15} placeholder="Ex: Natal"
              />
            </Field>
          </div>

          {/* Resultado do teste */}
          {testResult && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 8,
              background: testResult.ok ? 'var(--primary-dim)' : 'var(--danger-dim)',
              border: `1px solid ${testResult.ok ? 'var(--primary)' : 'var(--danger)'}44`,
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: testResult.ok ? 'var(--primary)' : 'var(--danger)' }}>
                {testResult.ok ? '✓ Payload gerado corretamente — chave válida!' : `✗ ${testResult.message}`}
              </p>
              {testResult.ok && (
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, wordBreak: 'break-all', fontFamily: 'DM Mono, monospace' }}>
                  {testResult.payload}
                </p>
              )}
            </div>
          )}

          {/* Aviso segurança */}
          <div style={{
            marginTop: 14, display: 'flex', gap: 10, padding: '10px 14px',
            background: 'var(--info-dim)', borderRadius: 8,
            border: '1px solid var(--info)44',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 12, color: 'var(--info)', lineHeight: 1.5 }}>
              O QR Code é gerado <strong style={{ fontWeight: 600 }}>localmente no seu dispositivo</strong> — a chave PIX não é enviada para nenhum servidor externo. Padrão EMV BR Code do Banco Central do Brasil.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button className="btn btn-ghost" onClick={handleTest}>
              Testar payload
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}
              style={{ minWidth: 140, justifyContent: 'center' }}>
              {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar configurações'}
            </button>
          </div>
        </div>

        {/* Como usar */}
        <div className="card">
          <p style={{ fontWeight: 600, marginBottom: 14 }}>Como funciona o PIX no caixa</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Escaneie os produtos e selecione PIX', 'var(--text-2)'],
              ['QR Code aparece com o valor exato da compra', 'var(--primary)'],
              ['Cliente escaneia com qualquer app bancário', 'var(--text-2)'],
              ['Verifique o recebimento no seu app do banco', 'var(--warning)'],
              ['Confirme o pagamento para finalizar a venda', 'var(--primary)'],
            ].map(([text, color], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--bg-3)', color: 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>{i + 1}</span>
                <p style={{ fontSize: 13, color }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}