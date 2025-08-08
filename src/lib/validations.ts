// Validações para etapas de vendas

export interface VendaValidationData {
  valor_venda?: number | string | null
  tipo_plano?: string | null
  valor_base_plano?: number | string | null
}

export interface ValidationResult {
  isValid: boolean
  missingFields: string[]
  message: string
}

/**
 * Valida se os dados obrigatórios estão preenchidos para "Vendas Realizadas"
 */
export function validateVendaRealizadaData(data: VendaValidationData): ValidationResult {
  const missingFields: string[] = []
  
  // Verificar valor da venda
  if (!data.valor_venda || Number(data.valor_venda) <= 0) {
    missingFields.push('Valor da Venda')
  }
  
  // Verificar tipo do plano
  if (!data.tipo_plano || data.tipo_plano.trim() === '') {
    missingFields.push('Tipo do Plano')
  }
  
  // Verificar valor base do plano
  if (!data.valor_base_plano || Number(data.valor_base_plano) <= 0) {
    missingFields.push('Valor Base do Plano')
  }
  
  const isValid = missingFields.length === 0
  
  let message = ''
  if (!isValid) {
    message = `Para marcar como "Vendas Realizadas", é obrigatório preencher:\n\n• ${missingFields.join('\n• ')}\n\nPor favor, preencha todos os campos antes de continuar.`
  }
  
  return {
    isValid,
    missingFields,
    message
  }
}

/**
 * Mostra um modal de alerta customizado para validação
 * DEPRECIADO: Use Toast em vez de alert do navegador
 */
export function showValidationAlert(message: string): void {
  // REMOVIDO: alert(message) - usar Toast components
  console.log('Validation alert (use Toast instead):', message)
}

/**
 * Valida se pode mudar para "Vendas Realizadas" e mostra alerta se necessário
 * DEPRECIADO: Use isVendaRealizadaDataComplete em vez desta função
 */
export function validateAndAlertVendaRealizada(data: VendaValidationData): boolean {
  const validation = validateVendaRealizadaData(data)
  
  if (!validation.isValid) {
    // REMOVIDO: showValidationAlert(validation.message)
    console.log('Validation failed (use Toast instead):', validation.message)
    return false
  }
  
  return true
}

/**
 * Verifica se dados estão completos para "Vendas Realizadas" sem mostrar alerta
 */
export function isVendaRealizadaDataComplete(data: VendaValidationData): boolean {
  return validateVendaRealizadaData(data).isValid
} 