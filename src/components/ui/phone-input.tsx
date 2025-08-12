"use client"

import { forwardRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

interface PhoneInputProps {
  value?: string
  onChange?: (value: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// Função para formatar número de telefone brasileiro
const formatBrazilianPhone = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '')
  
  // Se começar com 55, remove (código do país)
  const cleanNumbers = numbers.startsWith('55') ? numbers.substring(2) : numbers
  
  // Limita o tamanho baseado no tipo de número
  let limitedNumbers = cleanNumbers
  
  if (cleanNumbers.length <= 2) {
    // Apenas DDD
    limitedNumbers = cleanNumbers
  } else if (cleanNumbers.length <= 10) {
    // DDD + número fixo (8 dígitos)
    limitedNumbers = cleanNumbers.substring(0, 10)
  } else {
    // DDD + celular (9 dígitos)
    limitedNumbers = cleanNumbers.substring(0, 11)
  }
  
  // Aplica a formatação
  if (limitedNumbers.length === 0) {
    return ''
  } else if (limitedNumbers.length <= 2) {
    // Apenas DDD
    return `+55 (${limitedNumbers}`
  } else if (limitedNumbers.length <= 6) {
    // DDD + início do número
    const ddd = limitedNumbers.substring(0, 2)
    const inicio = limitedNumbers.substring(2)
    return `+55 (${ddd}) ${inicio}`
  } else if (limitedNumbers.length <= 10) {
    // Número fixo: +55 (dd) 9999-9999
    const ddd = limitedNumbers.substring(0, 2)
    const primeira = limitedNumbers.substring(2, 6)
    const segunda = limitedNumbers.substring(6)
    return `+55 (${ddd}) ${primeira}${segunda ? '-' + segunda : ''}`
  } else {
    // Número celular: +55 (dd) 9 9999-9999
    const ddd = limitedNumbers.substring(0, 2)
    const nono = limitedNumbers.substring(2, 3)
    const primeira = limitedNumbers.substring(3, 7)
    const segunda = limitedNumbers.substring(7)
    return `+55 (${ddd}) ${nono} ${primeira}${segunda ? '-' + segunda : ''}`
  }
}

// Função para extrair apenas números do telefone formatado
const extractNumbers = (formattedPhone: string): string => {
  const numbers = formattedPhone.replace(/\D/g, '')
  // Se começar com 55, mantém; senão, adiciona
  return numbers.startsWith('55') ? numbers : '55' + numbers
}

const PhoneInputField = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, placeholder = "+55 (11) 99999-9999", disabled, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')
    
    // Sincroniza o valor inicial e mudanças externas
    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatBrazilianPhone(value))
      }
    }, [value])
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // Se o usuário está apagando, permite
      if (inputValue.length < displayValue.length) {
        const formatted = formatBrazilianPhone(inputValue)
        setDisplayValue(formatted)
        onChange?.(extractNumbers(formatted))
        return
      }
      
      // Formatação normal
      const formatted = formatBrazilianPhone(inputValue)
      setDisplayValue(formatted)
      onChange?.(extractNumbers(formatted))
    }
    
    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(className)}
        maxLength={19} // +55 (11) 9 9999-9999 = 19 caracteres
      />
    )
  }
)

PhoneInputField.displayName = "PhoneInputField"

export { PhoneInputField } 