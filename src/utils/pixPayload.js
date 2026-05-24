/**
 * Gerador de payload PIX (EMV BR Code) — Banco Central do Brasil
 * Implementação conforme Manual de Padrões para Iniciação do PIX v3.3
 */

/** TLV: ID(2) + tamanho em 2 dígitos + valor */
const f = (id, val) => `${id}${String(val.length).padStart(2, '0')}${val}`

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, sem reflexão) */
export function crc16(str) {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) & 0xFF) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Remove acentos e caracteres inválidos para nome/cidade */
function sanitizeText(text, max) {
  return (text ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max) || 'LOJA'
}

/* ── Validadores por tipo de chave ─────────────────────────────── */

export const PIX_TYPES = [
  { value: 'cpf',    label: 'CPF',             placeholder: '000.000.000-00',            hint: '11 dígitos' },
  { value: 'cnpj',   label: 'CNPJ',            placeholder: '00.000.000/0001-00',         hint: '14 dígitos' },
  { value: 'phone',  label: 'Telefone',         placeholder: '+55 11 99999-9999',          hint: 'Com +55 e DDD' },
  { value: 'email',  label: 'Email',            placeholder: 'contato@loja.com',           hint: 'Email cadastrado no banco' },
  { value: 'random', label: 'Chave aleatória',  placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', hint: 'UUID gerado pelo banco' },
]

/**
 * Valida e formata a chave PIX para o payload.
 * @returns {{ valid: boolean, formatted?: string, error?: string }}
 */
export function validatePixKey(raw, type) {
  const key = (raw ?? '').trim()
  if (!key) return { valid: false, error: 'Chave PIX obrigatória' }

  switch (type) {
    case 'cpf': {
      const d = key.replace(/\D/g, '')
      if (d.length !== 11) return { valid: false, error: 'CPF deve ter 11 dígitos' }
      return { valid: true, formatted: d }
    }
    case 'cnpj': {
      const d = key.replace(/\D/g, '')
      if (d.length !== 14) return { valid: false, error: 'CNPJ deve ter 14 dígitos' }
      return { valid: true, formatted: d }
    }
    case 'phone': {
      const d = key.replace(/\D/g, '')
      // Aceita com ou sem +55; exige DDD (2) + 8 ou 9 dígitos = 10 ou 11 dígitos sem código do país
      const local = d.startsWith('55') ? d.slice(2) : d
      if (local.length < 10 || local.length > 11)
        return { valid: false, error: 'Telefone inválido. Use +55 + DDD + número (ex: +5511999999999)' }
      return { valid: true, formatted: `+55${local}` }
    }
    case 'email': {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key))
        return { valid: false, error: 'Email inválido' }
      return { valid: true, formatted: key.toLowerCase() }
    }
    case 'random': {
      const uuid = key.toLowerCase()
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid))
        return { valid: false, error: 'Chave aleatória inválida. Deve ser um UUID (ex: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)' }
      return { valid: true, formatted: uuid }
    }
    default:
      return { valid: false, error: 'Tipo de chave não selecionado' }
  }
}

/** Formata CPF enquanto o usuário digita */
export function maskCPF(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

/** Formata CNPJ enquanto o usuário digita */
export function maskCNPJ(v) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

/** Formata telefone enquanto o usuário digita */
export function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 13)
  if (d.length <= 2) return d.length ? `+${d}` : ''
  if (d.length <= 4) return `+${d.slice(0,2)} ${d.slice(2)}`
  if (d.length <= 9) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4)}`
  if (d.length <= 13) {
    const num = d.slice(4)
    const mid = num.length === 9 ? 5 : 4
    return `+${d.slice(0,2)} (${d.slice(2,4)}) ${num.slice(0,mid)}-${num.slice(mid)}`
  }
  return v
}

/**
 * Gera o payload PIX pronto para QR Code.
 * @param {{ pixKey, pixType, name, city, amount, txid? }} params
 */
export function buildPixPayload({ pixKey, pixType, name, city, amount, txid }) {
  const validation = validatePixKey(pixKey, pixType)
  if (!validation.valid) throw new Error(validation.error)

  const key          = validation.formatted
  const merchantName = sanitizeText(name, 25)
  const merchantCity = sanitizeText(city, 15)
  const safeTxid     = (txid ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'

  // Merchant Account Information (tag 26)
  const mai = f('00', 'br.gov.bcb.pix') + f('01', key)

  // Additional Data Field Template (tag 62) — txid via subtag 05
  const adf = f('05', safeTxid)

  let payload = ''
  payload += f('00', '01')                      // Payload Format Indicator
  payload += f('26', mai)                       // Merchant Account Info
  payload += f('52', '0000')                    // Merchant Category Code
  payload += f('53', '986')                     // Currency BRL
  if (amount > 0)
    payload += f('54', amount.toFixed(2))       // Amount
  payload += f('58', 'BR')                      // Country Code
  payload += f('59', merchantName)              // Merchant Name
  payload += f('60', merchantCity)              // Merchant City
  payload += f('62', adf)                       // Additional Data
  payload += '6304'                             // CRC placeholder

  return payload + crc16(payload)
}