// Este arquivo contém funcionalidades do Supabase
// A autenticação foi migrada para server-side com rotas API seguras
// URLs do Supabase não são mais expostas no frontend

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Para compatibilidade, mantemos algumas funções mas sem expor URLs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cliente apenas para operações específicas (não auth)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabase)
}

// Utility functions for common database operations

// Function to force schema cache refresh
export async function refreshSchemaCache() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured.')
    return false
  }

  try {
    // Try to fetch table info to force schema cache refresh
    const { error } = await supabase
      .from('clientes')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error refreshing schema cache:', error)
      return false
    }
    
    console.log('Schema cache refreshed successfully')
    return true
  } catch (error) {
    console.error('Error in refreshSchemaCache:', error)
    return false
  }
}

// Debug function to check table schema
export async function debugTableSchema() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured.')
    return
  }

  try {
    // Try to select specific columns to verify they exist
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, sdr_id, closer_id')
      .limit(1)
    
    if (error) {
      console.error('Schema debug error:', error)
      
      // Try alternative column names that might exist
      const { data: altData, error: altError } = await supabase
        .from('clientes')
        .select('id, nome')
        .limit(1)
        
      if (altError) {
        console.error('Basic table access error:', altError)
      } else {
        console.log('Basic table access works:', altData)
        
        // List all available columns by trying a broader query
        const { data: allData, error: allError } = await supabase
          .from('clientes')
          .select('*')
          .limit(1)
          
        if (allError) {
          console.error('Full table access error:', allError)
        } else {
          console.log('Available columns in clientes table:', allData?.[0] ? Object.keys(allData[0]) : 'No data available')
        }
      }
    } else {
      console.log('Schema debug success - sdr_id and closer_id columns are accessible:', data)
    }
  } catch (error) {
    console.error('Error in debugTableSchema:', error)
  }
}export async function getClientes() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return []
  }

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('criado_em', { ascending: false })
  
  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }
  
  return data
}

export async function getClienteById(id: number) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return null
  }

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching client:', error)
    return null
  }
  
  return data
}

export async function updateClienteEtapa(id: number, etapa: Database['public']['Enums']['etapa_enum']) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return null
  }

  // Primeiro, buscar os dados atuais do cliente
  const { data: clienteAtual, error: fetchError } = await supabase
    .from('clientes')
    .select('etapa, valor_venda, data_fechamento, tipo_plano, valor_base_plano')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching current client data:', fetchError)
    return null
  }

  // Preparar dados de atualização
  const updateData: any = { etapa }

  // Se está tentando marcar como "Vendas Realizadas", validar dados obrigatórios
  if (etapa === 'Vendas Realizadas') {
    if (!clienteAtual.valor_venda || clienteAtual.valor_venda <= 0 || 
        !clienteAtual.tipo_plano || !clienteAtual.valor_base_plano || clienteAtual.valor_base_plano <= 0) {
      console.error(`Cliente ${id}: Tentativa de marcar como "Vendas Realizadas" sem dados obrigatórios preenchidos`)
      return null // Não permitir a mudança
    }
  }

  // Se estava em "Vendas Realizadas" e está saindo para outra etapa, limpar dados de fechamento
  if (clienteAtual.etapa === 'Vendas Realizadas' && etapa !== 'Vendas Realizadas') {
    console.log(`Cliente ${id}: Saindo de "Vendas Realizadas" para "${etapa}" - Limpando dados de fechamento`)
    updateData.valor_venda = null
    updateData.data_fechamento = null
    updateData.tipo_plano = null
    updateData.valor_base_plano = null
  }

  const { data, error } = await supabase
    .from('clientes')
    .update(updateData)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating client stage:', error)
    return null
  }
  
  return data[0]
}

export async function getMetas() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return []
  }

  const { data, error } = await supabase
    .from('metas')
    .select('id, ano, mes, valor_meta, meta_closer, meta_sdr')
    .order('ano', { ascending: false })
    .order('mes', { ascending: false })
  
  if (error) {
    console.error('Error fetching goals:', error)
    return []
  }
  
  return data
}

// Dashboard specific functions
export async function getDashboardStats() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return {
      totalVendas: 0,
      valorTotal: 0,
      ticketMedio: 0,
      taxaConversao: 0,
      clientesAtivos: 0,
      vendasFechadas: 0
    }
  }

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('*')
  
  if (error || !clientes) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalVendas: 0,
      valorTotal: 0,
      ticketMedio: 0,
      taxaConversao: 0,
      clientesAtivos: 0,
      vendasFechadas: 0
    }
  }

  const vendasFechadas = clientes.filter(c => c.etapa === 'Vendas Realizadas')
  const clientesAtivos = clientes.filter(c => !c.etapa.includes('Fechado'))
  const valorTotal = vendasFechadas.reduce((sum, c) => sum + (c.valor_venda || 0), 0)
  const ticketMedio = vendasFechadas.length > 0 ? valorTotal / vendasFechadas.length : 0
  const taxaConversao = clientes.length > 0 ? (vendasFechadas.length / clientes.length) * 100 : 0

  return {
    totalVendas: clientes.length,
    valorTotal,
    ticketMedio,
    taxaConversao,
    clientesAtivos: clientesAtivos.length,
    vendasFechadas: vendasFechadas.length
  }
}

export async function getTopPerformers() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return []
  }

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('etapa', 'Vendas Realizadas')
  
  if (error || !clientes) {
    console.error('Error fetching top performers:', error)
    return []
  }

  // Group by closer_id and calculate totals
  const performerMap = new Map()
  
  clientes.forEach(cliente => {
    const closerId = cliente.closer_id
    if (!closerId) return
    
    if (!performerMap.has(closerId)) {
      performerMap.set(closerId, {
        name: closerId,
        value: 0,
        sales: 0
      })
    }
    
    const performer = performerMap.get(closerId)
    performer.value += cliente.valor_venda || 0
    performer.sales += 1
  })

  // Convert to array and sort by value
  return Array.from(performerMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Top 10
}

// Get daily sales data for today
export async function getDailySales() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return { dailySales: 0, dailyGoal: 0 }
  }

  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // First, get all closed sales
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('valor_venda, data_fechamento, atualizado_em')
      .eq('etapa', 'Vendas Realizadas')
    
    if (error) {
      console.error('Error fetching daily sales:', error)
      return { dailySales: 0, dailyGoal: 0 }
    }

    if (!clientes) {
      return { dailySales: 0, dailyGoal: 0 }
    }

    // Filter by today's date - use data_fechamento if available, otherwise use atualizado_em
    const todaySales = clientes.filter(cliente => {
      const dateToCheck = cliente.data_fechamento || cliente.atualizado_em
      if (!dateToCheck) return false
      
      const clienteDate = new Date(dateToCheck)
      return clienteDate >= startOfDay && clienteDate < endOfDay
    })

    const dailySales = todaySales.reduce((sum, c) => sum + (c.valor_venda || 0), 0)
    
    // Get current month meta to calculate daily goal
    const currentMeta = await getCurrentMonthMeta()
    const dailyGoal = currentMeta ? currentMeta.valor_meta / 30 : 0

    return { dailySales, dailyGoal }
  } catch (error) {
    console.error('Error in getDailySales:', error)
    return { dailySales: 0, dailyGoal: 0 }
  }
}

// Get daily meetings data for today
export async function getDailyMeetings() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return { dailyMeetings: 0, dailyGoal: 0 }
  }

  try {
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]

    // Get all meetings for today
    const { data: reunioes, error } = await supabase
      .from('reunioes')
      .select('*')
      .eq('data_reuniao', todayString)
    
    if (error) {
      console.error('Error fetching daily meetings:', error)
      return { dailyMeetings: 0, dailyGoal: 0 }
    }

    const dailyMeetings = reunioes?.length || 0
    
    // Get current month meta SDR to calculate daily goal for meetings
    const currentMetaSdr = await getCurrentMonthMetaSdr()
    const currentDate = new Date()
    const workingDays = getWorkingDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)
    const dailyGoal = currentMetaSdr ? currentMetaSdr.valor_meta / workingDays : 0

    return { dailyMeetings, dailyGoal }
  } catch (error) {
    console.error('Error in getDailyMeetings:', error)
    return { dailyMeetings: 0, dailyGoal: 0 }
  }
}

// Get monthly sales data for charts
export async function getMonthlySalesData() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return []
  }

  try {
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('valor_venda, data_fechamento, atualizado_em')
      .eq('etapa', 'Vendas Realizadas')
    
    if (error) {
      console.error('Error fetching monthly sales data:', error)
      return []
    }

    if (!clientes) {
      return []
    }

    // Group by month and sum sales
    const monthlyData = new Map()
    
    clientes.forEach(cliente => {
      // Use data_fechamento if available, otherwise use atualizado_em
      const dateToUse = cliente.data_fechamento || cliente.atualizado_em
      if (!dateToUse) return
      
      try {
        const date = new Date(dateToUse)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: '2-digit' 
        }).replace(',', ' de')
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthLabel,
            sales: 0
          })
        }
        
        monthlyData.get(monthKey).sales += cliente.valor_venda || 0
      } catch {
        console.warn('Invalid date found:', dateToUse)
      }
    })

    // Convert to array and sort by date
    return Array.from(monthlyData.values())
      .sort((a, b) => {
        // Parse "agosto de 25" format to proper date
        const parseMonth = (monthStr: string) => {
          const [monthName, year] = monthStr.split(' de ')
          const monthNames = [
            'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
          ]
          const monthIndex = monthNames.indexOf(monthName.toLowerCase())
          return new Date(2000 + parseInt(year), monthIndex)
        }
        
        const aDate = parseMonth(a.month)
        const bDate = parseMonth(b.month)
        return aDate.getTime() - bDate.getTime()
      })
  } catch (error) {
    console.error('Error in getMonthlySalesData:', error)
    return []
  }
}

// Get monthly sales summary statistics
export async function getMonthlySalesSummary() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return {
      currentMonthSales: 0,
      currentMonthCount: 0,
      averageTicket: 0
    }
  }

  try {
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('valor_venda, data_fechamento, atualizado_em')
      .eq('etapa', 'Vendas Realizadas')
    
    if (error) {
      console.error('Error fetching monthly sales summary:', error)
      return {
        currentMonthSales: 0,
        currentMonthCount: 0,
        averageTicket: 0
      }
    }

    if (!clientes) {
      return {
        currentMonthSales: 0,
        currentMonthCount: 0,
        averageTicket: 0
      }
    }

    // Get current month data
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    let currentMonthSales = 0
    let currentMonthCount = 0
    let totalSales = 0
    let totalCount = 0

    clientes.forEach(cliente => {
      const dateToUse = cliente.data_fechamento || cliente.atualizado_em
      if (!dateToUse) return
      
      try {
        const date = new Date(dateToUse)
        const saleValue = cliente.valor_venda || 0
        
        // Add to totals
        totalSales += saleValue
        totalCount += 1
        
        // Check if it's current month
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          currentMonthSales += saleValue
          currentMonthCount += 1
        }
      } catch {
        console.warn('Invalid date found:', dateToUse)
      }
    })

    const averageTicket = totalCount > 0 ? totalSales / totalCount : 0

    return {
      currentMonthSales,
      currentMonthCount,
      averageTicket
    }
  } catch (error) {
    console.error('Error in getMonthlySalesSummary:', error)
    return {
      currentMonthSales: 0,
      currentMonthCount: 0,
      averageTicket: 0
    }
  }
}

// Get funnel data based on current client stages
export async function getFunnelData(startDate?: string, endDate?: string) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return []
  }

  try {
    let query = supabase
      .from('clientes')
      .select('etapa, valor_venda, criado_em')
    
    // Apply date filters if provided
    if (startDate && endDate) {
      query = query
        .gte('criado_em', startDate)
        .lte('criado_em', endDate + 'T23:59:59')
    }
    
    const { data: clientes, error } = await query
    
    if (error) {
      console.error('Error fetching funnel data:', error)
      return []
    }

    if (!clientes) {
      return []
    }

    // Count clients by stage
    const stageCounts = {
      'Lead': 0,
      'Agendados': 0,
      'Reunioes Feitas': 0,
      'Vendas Realizadas': 0,
      'Reunioes sem Fechamento': 0, // Reuniões realizadas mas sem venda
    }

    clientes.forEach(cliente => {
      if (cliente.etapa === 'Lead') {
        stageCounts['Lead']++
      } else if (cliente.etapa === 'Leads Qualificados') {
        // Leads qualificados agora contam como leads normais
        stageCounts['Lead']++
      } else if (cliente.etapa === 'Agendados') {
        stageCounts['Agendados']++
      } else if (cliente.etapa === 'Reunioes Feitas') {
        // Reuniões feitas sempre contam como reuniões feitas, não vendas
        stageCounts['Reunioes Feitas']++
      } else if (cliente.etapa === 'Vendas Realizadas') {
        stageCounts['Vendas Realizadas']++
      }
    })

    const totalLeads = clientes.length
    const agendados = stageCounts['Agendados']
    const reunioesFeitas = stageCounts['Reunioes Feitas']
    const vendasRealizadas = stageCounts['Vendas Realizadas']
    
    // Reuniões sem fechamento = reuniões feitas - vendas realizadas
    const reunioesSemFechamento = Math.max(0, reunioesFeitas - vendasRealizadas)

    return [
      {
        stage: "Leads",
        value: totalLeads,
        percentage: 100,
        color: "#22c55e"
      },
      {
        stage: "Agendados",
        value: agendados,
        percentage: totalLeads > 0 ? (agendados / totalLeads) * 100 : 0,
        color: "#15803d"
      },
      {
        stage: "Reuniões Feitas",
        value: reunioesFeitas,
        percentage: totalLeads > 0 ? (reunioesFeitas / totalLeads) * 100 : 0,
        color: "#166534"
      },
      {
        stage: "Vendas Realizadas",
        value: vendasRealizadas,
        percentage: totalLeads > 0 ? (vendasRealizadas / totalLeads) * 100 : 0,
        color: "#14532d"
      },
      {
        stage: "Reuniões sem Fechamento",
        value: reunioesSemFechamento,
        percentage: totalLeads > 0 ? (reunioesSemFechamento / totalLeads) * 100 : 0,
        color: "#dc2626"
      }
    ]
  } catch (error) {
    console.error('Error loading funnel data:', error)
    return []
  }
}

// Get leads evolution data
export async function getLeadsEvolutionData() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return []
  }

  try {
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('criado_em, etapa, data_fechamento')
      .order('criado_em', { ascending: true })
    
    if (error) {
      console.error('Error fetching leads evolution data:', error)
      return []
    }

    if (!clientes) {
      return []
    }

    // Group by month and calculate metrics
    const monthlyLeads = new Map()
    
    clientes.forEach(cliente => {
      try {
        const date = new Date(cliente.criado_em)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: '2-digit' 
        }).replace(',', ' de')
        
        if (!monthlyLeads.has(monthKey)) {
          monthlyLeads.set(monthKey, {
            month: monthLabel,
            leadsTotal: 0,
            reunioesAgendadas: 0,
            reunioesRealizadas: 0,
            vendas: 0
          })
        }
        
        const monthData = monthlyLeads.get(monthKey)
        monthData.leadsTotal++
        
        // Count scheduled meetings (agendados)
        if (['Agendados', 'Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)) {
          monthData.reunioesAgendadas++
        }
        
        // Count completed meetings (reuniões realizadas)
        if (['Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)) {
          monthData.reunioesRealizadas++
        }
        
        // Count sales
        if (cliente.etapa === 'Vendas Realizadas') {
          monthData.vendas++
        }
      } catch {
        console.warn('Invalid date found in criado_em:', cliente.criado_em)
      }
    })

    return Array.from(monthlyLeads.values())
      .sort((a, b) => {
        // Parse "agosto de 25" format to proper date
        const parseMonth = (monthStr: string) => {
          const [monthName, year] = monthStr.split(' de ')
          const monthNames = [
            'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
          ]
          const monthIndex = monthNames.indexOf(monthName.toLowerCase())
          return new Date(2000 + parseInt(year), monthIndex)
        }
        
        const aDate = parseMonth(a.month)
        const bDate = parseMonth(b.month)
        return aDate.getTime() - bDate.getTime()
      })
  } catch (error) {
    console.error('Error in getLeadsEvolutionData:', error)
    return []
  }
}

// Get current month meta
export async function getCurrentMonthMeta() {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    // Buscar sempre a meta do ID = 2 (meta única do dashboard)
    const { data: meta, error } = await supabase
      .from('metas')
      .select('id, valor_meta, meta_closer, meta_sdr, valor_meta_mrr, meta_reunioes_sdr')
      .eq('id', 2)
      .single()

    if (error) {
      console.error('Supabase error fetching meta ID=2:', error.code, error.message)
      throw new Error(`Failed to fetch meta: ${error.message}`)
    }

    if (!meta) {
      console.error('No meta data returned for ID=2')
      throw new Error('Meta ID=2 not found in database')
    }

    console.log('Meta data from database (ID=2):', meta)

    // Return the meta object from database
    return {
      valor_meta: meta.valor_meta,
      id: meta.id
    }
  } catch (error) {
    console.error('Error in getCurrentMonthMeta:', error)
    throw error
  }
}

// Get current month meta closer
export async function getCurrentMonthMetaCloser() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured, using default meta closer values')
    return { valor_meta: 150000, ano: 2025, mes: 7 } // Default values
  }

  try {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const { data: meta, error } = await supabase
      .from('metas')
      .select('meta_closer, ano, mes')
      .eq('ano', currentYear)
      .eq('mes', currentMonth)
      .single()
    
    if (error) {
      // Check if it's a "no rows" error (which is expected when no meta exists)
      if (error.code === 'PGRST116') {
        console.info(`No meta closer found for ${currentYear}/${currentMonth}, using default values`)
      } else {
        console.error('Supabase error fetching meta closer:', error.code, error.message)
      }
      return { valor_meta: 150000, ano: currentYear, mes: currentMonth }
    }

    if (!meta) {
      console.info(`No meta closer data returned for ${currentYear}/${currentMonth}, using default values`)
      return { valor_meta: 150000, ano: currentYear, mes: currentMonth }
    }
    
    return {
      valor_meta: meta.meta_closer || 150000,
      ano: meta.ano,
      mes: meta.mes
    }
  } catch (error) {
    console.error('Error in getCurrentMonthMetaCloser:', error)
    return { valor_meta: 150000, ano: 2025, mes: 7 } // Default values
  }
}

// Get current month meta SDR
export async function getCurrentMonthMetaSdr() {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    // Buscar sempre a meta do ID = 2 (meta única do dashboard)
    const { data: meta, error } = await supabase
      .from('metas')
      .select('id, meta_sdr, meta_reunioes_sdr')
      .eq('id', 2)
      .single()

    if (error) {
      console.error('Supabase error fetching meta SDR (ID=2):', error.code, error.message)
      throw new Error(`Failed to fetch meta SDR: ${error.message}`)
    }

    if (!meta) {
      console.error('No meta SDR data returned for ID=2')
      throw new Error('Meta SDR ID=2 not found in database')
    }

    return {
      valor_meta: meta.meta_reunioes_sdr || meta.meta_sdr,
      id: meta.id
    }
  } catch (error) {
    console.error('Error in getCurrentMonthMetaSdr:', error)
    throw error
  }
}

// Function to update meta (sempre atualiza ID = 2)
export async function upsertMeta(ano: number, mes: number, valor_meta: number) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Using local state only.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    console.log('Updating meta ID=2 with valor_meta:', valor_meta)

    // Atualizar diretamente o ID = 2
    const { data, error } = await supabase
      .from('metas')
      .update({ valor_meta: valor_meta })
      .eq('id', 2)
      .select('id, valor_meta, meta_closer, meta_sdr, valor_meta_mrr, meta_reunioes_sdr')
      .single()

    if (error) {
      console.error('Error updating meta ID=2:', JSON.stringify(error, null, 2))
      const errorMessage = error.message || 'Unknown database error - check console for details'
      return { success: false, error: errorMessage }
    }

    console.log('Meta ID=2 updated successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error in upsertMeta:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

// Function to create or update meta closer
export async function upsertMetaCloser(ano: number, mes: number, valor_meta: number) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Using local state only.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // First try to update existing record
    const { data: existingMeta, error: fetchError } = await supabase
      .from('metas')
      .select('id, ano, mes, valor_meta, meta_closer, meta_sdr')
      .eq('ano', ano)
      .eq('mes', mes)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing meta:', fetchError)
      return { success: false, error: fetchError.message }
    }

    const upsertData = {
      ano,
      mes,
      valor_meta: existingMeta?.valor_meta || 0,
      meta_closer: valor_meta,
      meta_sdr: existingMeta?.meta_sdr || 0
    }

    console.log('Upserting meta closer with data:', upsertData)

    const { data, error } = await supabase
      .from('metas')
      .upsert(upsertData, {
        onConflict: 'ano,mes'
      })
      .select('id, ano, mes, valor_meta, meta_closer, meta_sdr')
      .single()

    if (error) {
      console.error('Error upserting meta closer:', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        upsertData
      })
      return { success: false, error: error.message || 'Unknown database error' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in upsertMetaCloser:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

// Function to update meta SDR (sempre atualiza ID = 2)
export async function upsertMetaSdr(ano: number, mes: number, valor_meta: number) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Using local state only.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    console.log('Updating meta SDR ID=2 with meta_reunioes_sdr:', valor_meta)

    // Atualizar diretamente o ID = 2
    const { data, error } = await supabase
      .from('metas')
      .update({ meta_reunioes_sdr: valor_meta })
      .eq('id', 2)
      .select('id, valor_meta, meta_closer, meta_sdr, valor_meta_mrr, meta_reunioes_sdr')
      .single()

    if (error) {
      console.error('Error updating meta SDR ID=2:', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint
      })
      return { success: false, error: error.message || 'Unknown database error' }
    }

    console.log('Meta SDR ID=2 updated successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error in upsertMetaSdr:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

// Function to create a new client
export async function createCliente(clienteData: {
  nome: string
  email?: string | null
  telefone?: string | null
  empresa?: string | null
  origem?: string | null
  sdr_id?: number | null
  closer_id?: number | null
  etapa: Database['public']['Enums']['etapa_enum']
  endereco?: string | null
  valor_venda?: number | null
}) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Cannot create client.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // Debug: Log the data being sent to Supabase
    console.log('Creating client with data:', clienteData)
    
    const { data, error } = await supabase
      .from('clientes')
      .insert([clienteData])
      .select('*')
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createCliente:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function updateCliente(id: number, clienteData: {
  nome?: string
  email?: string | null
  telefone?: string | null
  empresa?: string | null
  origem?: string | null
  sdr_id?: number | null
  closer_id?: number | null
  etapa?: Database['public']['Enums']['etapa_enum']
  endereco?: string | null
  valor_venda?: number | null
}) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Cannot update client.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // Debug: Log the data being sent to Supabase
    console.log('Updating client with data:', { id, clienteData })
    
    // First, let's try to refresh the schema cache if the error occurs
    const { data, error } = await supabase
      .from('clientes')
      .update(clienteData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating client:', error)
      
      // If it's a schema cache error, try alternative approach
      if (error.code === 'PGRST204') {
        console.log('Schema cache error detected. Trying alternative approach...')
        
        // Try updating without the problematic fields first, then add them
        const { closer_id, sdr_id, ...safeData } = clienteData
        
        const { data: partialData, error: partialError } = await supabase
          .from('clientes')
          .update(safeData)
          .eq('id', id)
          .select('*')
          .single()

        if (partialError) {
          return { success: false, error: `Primary update failed: ${partialError.message}` }
        }

        // Now try to update the collaborator IDs if they were provided
        if (closer_id !== undefined || sdr_id !== undefined) {
          const collaboratorUpdate: { sdr_id?: number | null; closer_id?: number | null } = {}
          if (sdr_id !== undefined) collaboratorUpdate.sdr_id = sdr_id
          if (closer_id !== undefined) collaboratorUpdate.closer_id = closer_id

          const { data: finalData, error: finalError } = await supabase
            .from('clientes')
            .update(collaboratorUpdate)
            .eq('id', id)
            .select('*')
            .single()

          if (finalError) {
            console.warn('Collaborator update failed, but main data was saved:', finalError)
            return { 
              success: true, 
              data: partialData, 
              warning: `Main data updated but collaborator assignment failed: ${finalError.message}` 
            }
          }

          return { success: true, data: finalData }
        }

        return { success: true, data: partialData }
      }
      
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateCliente:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

// Colaboradores functions
export async function getColaboradores() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return []
  }

  const { data, error } = await supabase
    .from('colaboradores')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching colaboradores:', error)
    return []
  }
  
  return data
}

export async function createColaborador(colaborador: { nome: string; funcao: string }) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase
      .from('colaboradores')
      .insert([colaborador])
      .select()
      .single()

    if (error) {
      console.error('Error creating colaborador:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createColaborador:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function updateColaborador(id: number, updates: { nome?: string; funcao?: string }) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase
      .from('colaboradores')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating colaborador:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateColaborador:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function deleteColaborador(id: number) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { error } = await supabase
      .from('colaboradores')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting colaborador:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteColaborador:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

// Comissões functions
export async function getVendasPorColaborador() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return []
  }

  try {
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select(`
        id,
        nome,
        valor_venda,
        data_fechamento,
        etapa,
        sdr_id,
        closer_id
      `)
      .eq('etapa', 'Vendas Realizadas')
      .not('valor_venda', 'is', null)
      .not('data_fechamento', 'is', null)

    if (error) {
      console.error('Error fetching vendas por colaborador:', error)
      return []
    }

    return clientes || []
  } catch (error) {
    console.error('Error in getVendasPorColaborador:', error)
    return []
  }
}

export async function getComissaoStats() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return { colaboradores: [], vendas: [] }
  }

  try {
    // Buscar todos os colaboradores
    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('*')
      .order('nome')

    if (colaboradoresError) {
      console.error('Error fetching colaboradores:', colaboradoresError)
      return { colaboradores: [], vendas: [] }
    }

    // Buscar vendas realizadas
    const vendas = await getVendasPorColaborador()

    return { colaboradores: colaboradores || [], vendas }
  } catch (error) {
    console.error('Error in getComissaoStats:', error)
    return { colaboradores: [], vendas: [] }
  }
}

// Tipos para configuração de comissão com ranks
export async function getReunioes() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Using mock data.')
    // Mock data para desenvolvimento
    return [
      {
        id: 1,
        sdr_id: 1,
        cliente_id: 1,
        tipo: 'qualificada' as const,
        data_reuniao: '2024-01-15',
        criado_em: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        sdr_id: 1,
        cliente_id: 2,
        tipo: 'gerou_venda' as const,
        data_reuniao: '2024-01-20',
        criado_em: '2024-01-20T14:30:00Z'
      }
    ]
  }

  const { data, error } = await supabase
    .from('reunioes')
    .select('*')
    .order('data_reuniao', { ascending: false })

  if (error) {
    console.error('Error fetching reunioes:', error)
    return []
  }

  return data || []
}

export async function getVendasComPlanos() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Using mock data.')
    // Mock data para desenvolvimento
    return [
      {
        id: 1,
        closer_id: 2,
        valor_venda: 150,
        valor_base_plano: 100,
        tipo_plano: 'mensal' as const,
        data_fechamento: '2024-01-25',
        criado_em: '2024-01-25T16:00:00Z'
      },
      {
        id: 2,
        closer_id: 2,
        valor_venda: 600,
        valor_base_plano: 480,
        tipo_plano: 'semestral' as const,
        data_fechamento: '2024-01-28',
        criado_em: '2024-01-28T11:15:00Z'
      }
    ]
  }

  const { data, error } = await supabase
    .from('clientes')
    .select('id, closer_id, valor_venda, valor_base_plano, tipo_plano, data_fechamento, criado_em')
    .eq('etapa', 'Vendas Realizadas')
    .not('valor_venda', 'is', null)
    .not('closer_id', 'is', null)
    .not('data_fechamento', 'is', null)
    .order('data_fechamento', { ascending: false })

  if (error) {
    console.error('Error fetching vendas com planos:', error)
    return []
  }

  return data || []
}

export async function getMetasMensais() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Using mock data.')
    // Mock data para desenvolvimento
    return [
      {
        id: 1,
        ano: 2024,
        mes: 1,
        valor_meta_mrr: 15000,
        meta_reunioes_sdr: 50,
        valor_meta: 100000,
        meta_closer: 80000,
        meta_sdr: 40000
      }
    ]
  }

  const { data, error } = await supabase
    .from('metas')
    .select('*')
    .order('ano', { ascending: false })
    .order('mes', { ascending: false })

  if (error) {
    console.error('Error fetching metas:', error)
    return []
  }

  return data || []
}

export async function getNovoComissionamentoStats() {
  try {
    const [colaboradores, reunioes, vendas, metas] = await Promise.all([
      getColaboradores(),
      getReunioes(),
      getVendasComPlanos(),
      getMetasMensais()
    ])

    return {
      colaboradores: colaboradores || [],
      reunioes: reunioes || [],
      vendas: vendas || [],
      metas: metas || []
    }
  } catch (error) {
    console.error('Error in getNovoComissionamentoStats:', error)
    return {
      colaboradores: [],
      reunioes: [],
      vendas: [],
      metas: []
    }
  }
}

// Função para calcular MRR por mês
export async function getMRREvolution() {
  if (!isSupabaseConfigured() || !supabase) {
    // Mock data para desenvolvimento
    return [
      { mes: 'Out/24', mrr: 0 },
      { mes: 'Nov/24', mrr: 0 },
      { mes: 'Dez/24', mrr: 45000 },
      { mes: 'Jan/25', mrr: 120000 },
      { mes: 'Fev/25', mrr: 280000 },
      { mes: 'Mar/25', mrr: 380000 },
      { mes: 'Abr/25', mrr: 450000 },
      { mes: 'Mai/25', mrr: 480000 },
      { mes: 'Jun/25', mrr: 520000 },
      { mes: 'Jul/25', mrr: 680000 },
      { mes: 'Ago/25', mrr: 650000 }
    ]
  }

  try {
    const { data: vendas, error } = await supabase
      .from('clientes')
      .select('valor_venda, tipo_plano, data_fechamento')
      .eq('etapa', 'Vendas Realizadas')
      .not('valor_venda', 'is', null)
      .not('data_fechamento', 'is', null)
      .order('data_fechamento', { ascending: true })

    if (error) throw error

    // Agrupar por mês e calcular MRR
    const mrrByMonth: { [key: string]: number } = {}
    
    vendas?.forEach(venda => {
      if (venda.data_fechamento && venda.valor_venda && venda.tipo_plano) {
        const date = new Date(venda.data_fechamento)
        const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`
        
        // Calcular MRR baseado no tipo de plano
        let mrr = venda.valor_venda
        switch (venda.tipo_plano) {
          case 'trimestral':
            mrr = venda.valor_venda / 3
            break
          case 'semestral':
            mrr = venda.valor_venda / 6
            break
          case 'anual':
            mrr = venda.valor_venda / 12
            break
          default: // mensal
            mrr = venda.valor_venda
        }
        
        mrrByMonth[monthKey] = (mrrByMonth[monthKey] || 0) + mrr
      }
    })

    return Object.entries(mrrByMonth).map(([mes, mrr]) => ({ mes, mrr }))
  } catch (error) {
    console.error('Error calculating MRR evolution:', error)
    return []
  }
}

// Função para calcular dias úteis do mês
export function getWorkingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  let workingDays = 0
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()
    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++
    }
  }
  
  return workingDays
}

// Função para obter estatísticas avançadas do dashboard
export async function getAdvancedDashboardStats(periodo?: string, customStartDate?: string, customEndDate?: string) {
  // Definir datas baseadas no período
  let dataInicio: string | null = null
  let dataFim: string | null = null
  
  if (periodo === 'custom' && customStartDate && customEndDate) {
    dataInicio = customStartDate
    dataFim = customEndDate
  } else if (periodo && periodo !== 'all') {
    const agora = new Date()
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
    
    switch (periodo) {
      case 'hoje':
        dataInicio = hoje.toISOString().split('T')[0]
        break
      case 'ontem':
        const ontem = new Date(hoje)
        ontem.setDate(ontem.getDate() - 1)
        dataInicio = ontem.toISOString().split('T')[0]
        dataFim = hoje.toISOString().split('T')[0]
        break
      case 'ultimos7':
        const setedays = new Date(hoje)
        setedays.setDate(setedays.getDate() - 6) // -6 para ter exatamente 7 dias incluindo hoje
        dataInicio = setedays.toISOString().split('T')[0]
        break
      case 'ultimos30':
        const trintaDias = new Date(hoje)
        trintaDias.setDate(trintaDias.getDate() - 29) // -29 para ter exatamente 30 dias incluindo hoje
        dataInicio = trintaDias.toISOString().split('T')[0]
        break
      case 'esteMes':
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0]
        break
      case 'mesPassado':
        const mesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
        const inicioEsteMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
        dataInicio = mesPassado.toISOString().split('T')[0]
        dataFim = inicioEsteMes.toISOString().split('T')[0]
        break
    }
  }

  try {
    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured() || !supabase) {
      console.error('Supabase não está configurado. Verifique as variáveis de ambiente.')
      throw new Error('Supabase não configurado')
    }

    // Construir queries
    let clientesQuery = supabase.from('clientes').select('*')
    if (dataInicio) {
      clientesQuery = clientesQuery.gte('criado_em', dataInicio)
    }
    if (dataFim) {
      clientesQuery = clientesQuery.lt('criado_em', dataFim)
    }

    console.log('Fetching dashboard data...')

    const [clientesResult, metasResult, reunioesResult] = await Promise.all([
      clientesQuery,
      supabase.from('metas').select('*').order('ano', { ascending: false }).order('mes', { ascending: false }).limit(1),
      supabase.from('reunioes').select('*')
    ])

    // Log específico para cada query
    if (clientesResult.error) {
      console.error('Error fetching clientes:', clientesResult.error)
    }
    if (metasResult.error) {
      console.error('Error fetching metas:', metasResult.error)
    }
    if (reunioesResult.error) {
      console.error('Error fetching reunioes:', reunioesResult.error)
    }

    if (clientesResult.error || metasResult.error || reunioesResult.error) {
      throw new Error('Erro ao buscar dados do banco')
    }

    const clientes = clientesResult
    const metas = metasResult
    const reunioes = reunioesResult

    // Filtrar vendas - APENAS clientes na etapa "Vendas Realizadas" com valor
    const vendas = clientes.data?.filter(c => 
      c.etapa === 'Vendas Realizadas' && c.valor_venda && c.valor_venda > 0
    ) || []
    
    // Criar reuniões automaticamente para vendas que têm SDR mas não têm reunião
    for (const venda of vendas) {
      if (venda.sdr_id && venda.etapa === 'Vendas Realizadas') {
        await createReuniaoFromVenda(venda)
      }
    }
    
        // Calcular faturamento total (valor das vendas)
    const totalFaturamento = vendas.reduce((sum, v) => sum + (v.valor_venda || 0), 0)
    
    // Calcular MRR total (valor recorrente mensal)
    const totalMRR = vendas.reduce((sum, v) => {
      const valorVenda = v.valor_venda || 0
      switch (v.tipo_plano) {
        case 'trimestral':
          return sum + (valorVenda / 3)
        case 'semestral':
          return sum + (valorVenda / 6)
        case 'anual':
          return sum + (valorVenda / 12)
        default: // mensal
          return sum + valorVenda
      }
    }, 0)
    
    const metaMensal = metas.data?.[0]?.valor_meta || 10000
    const metaReunioesSdr = metas.data?.[0]?.meta_sdr || 50
    
    // Contar planos por tipo
    const planosMensais = vendas.filter(v => v.tipo_plano === 'mensal').length
    const planosTrimestrais = vendas.filter(v => v.tipo_plano === 'trimestral').length
    const planosSemestrais = vendas.filter(v => v.tipo_plano === 'semestral').length
    const planosAnuais = vendas.filter(v => v.tipo_plano === 'anual').length
    
    // Contar reuniões marcadas do período - APENAS de clientes em etapas válidas
    let reunioesFiltradas = reunioes.data || []
    if (dataInicio) {
      reunioesFiltradas = reunioesFiltradas.filter(r => {
        if (!r.data_reuniao) return false
        const reuniaoDate = r.data_reuniao
        if (dataFim) {
          return reuniaoDate >= dataInicio && reuniaoDate < dataFim
        }
        return reuniaoDate >= dataInicio
      })
    }
    
    // FILTRO IMPORTANTE: Só contar reuniões de clientes que estão em etapas válidas
    if (reunioesFiltradas.length > 0) {
      reunioesFiltradas = reunioesFiltradas.filter(reuniao => {
        if (!reuniao.cliente_id) return false
        
        // Buscar o cliente associado à reunião
        const cliente = clientes.data?.find(c => c.id === reuniao.cliente_id)
        
        // Só contar se cliente existe E está em etapa válida para reuniões
        return cliente && ['Agendados', 'Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)
      })
    }
    
    // Se não há reuniões registradas válidas, mas há vendas, considerar cada venda como uma reunião que gerou resultado
    if (reunioesFiltradas.length === 0 && vendas.length > 0) {
      console.log('Não há reuniões registradas válidas, mas há vendas. Considerando vendas como reuniões.')
      reunioesFiltradas = vendas.map((venda, index) => ({
        id: `venda_${venda.id}`,
        sdr_id: venda.sdr_id,
        tipo: 'gerou_venda',
        data_reuniao: venda.data_fechamento || venda.atualizado_em || new Date().toISOString().split('T')[0]
      }))
    }
    
    // Contar reuniões realizadas pelos clientes no período (para garantir que realizadas também contem como marcadas)
    let clientesFiltrados = clientes.data || []
    if (dataInicio) {
      clientesFiltrados = clientesFiltrados.filter(c => {
        if (!c.criado_em) return false
        const clienteDate = c.criado_em
        if (dataFim) {
          return clienteDate >= dataInicio && clienteDate < dataFim
        }
        return clienteDate >= dataInicio
      })
    }
    
    const reunioesRealizadasPorClientes = clientesFiltrados.filter(c => 
      ['Reunioes Feitas', 'Vendas Realizadas'].includes(c.etapa)
    ).length
    
    // Total de reuniões marcadas = MAX entre reuniões na tabela e reuniões realizadas pelos clientes
    const totalReunioesMarcadas = Math.max(reunioesFiltradas.length, reunioesRealizadasPorClientes)
    
    const currentDate = new Date()
    const workingDays = getWorkingDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)
    const currentDay = currentDate.getDate()
    const workingDaysElapsed = Math.min(currentDay, workingDays)
    
    const metaDiaria = metaMensal / workingDays
    
    // Buscar vendas apenas do dia atual para a meta diária (não deve ser filtrada por período)
    const dailySalesData = await getDailySales()
    const faturamentoDiario = dailySalesData.dailySales
    
    // Buscar reuniões apenas do dia atual para a meta diária de reuniões
    const dailyMeetingsData = await getDailyMeetings()
    const reunioesDiarias = dailyMeetingsData.dailyMeetings
    const metaDiariaReunioes = metaReunioesSdr / workingDays
    
    // O investimento total agora virá do estado do componente, não mais de valores fixos aqui.
    // O cálculo será feito no frontend com base nos dados do Meta Ads.
    const totalInvestidoPeriodo = 0 // Será substituído pelo valor real no frontend
    
    return {
      totalFaturamento,
      totalMRR, // Adicionar MRR calculado corretamente
      metaMensal,
      metaDiaria,
      faturamentoDiario,
      progressoMetaDiaria: metaDiaria > 0 ? (faturamentoDiario / metaDiaria) * 100 : 0,
      diasUteis: workingDays,
      diasUteisDecorridos: workingDaysElapsed,
      ticketMedio: vendas.length > 0 ? totalFaturamento / vendas.length : 0,
      totalVendas: vendas.length,
      totalInvestido: totalInvestidoPeriodo,
      cac: 0, // Será calculado no frontend
      roas: 0, // Será calculado no frontend
      clientesAdquiridos: vendas.length,
      totalReunioesMarcadas,
      metaReunioesSdr,
      metaDiariaReunioes,
      reunioesDiarias,
      progressoMetaDiariaReunioes: metaDiariaReunioes > 0 ? (reunioesDiarias / metaDiariaReunioes) * 100 : 0,
      planosMensais,
      planosTrimestrais,
      planosSemestrais,
      planosAnuais
    }
  } catch (error) {
    console.error('Error getting advanced dashboard stats:', error)
    
    // Em caso de erro, retornar dados zerados
    console.error('Erro ao buscar dados do dashboard. Verifique a conexão com o banco.')
    throw error
    

  }
}

// Função para buscar planos do Supabase
export async function getPlanos() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Using mock data.')
    // Mock data baseado na estrutura fornecida
    return [
      {
        id: 1,
        nome: 'Basic',
        periodo: 'Mensal',
        valor: 99.90,
        desconto: 0,
        trial: true,
        obs: '',
        nivel: 1,
        qtde_dias_trial: 5
      },
      {
        id: 2,
        nome: 'Basic',
        periodo: 'Trimestral',
        valor: 299.70,
        desconto: 29.90,
        trial: true,
        obs: '(10% OFF)',
        nivel: 1,
        qtde_dias_trial: 5
      },
      {
        id: 3,
        nome: 'Basic',
        periodo: 'Semestral',
        valor: 599.40,
        desconto: 119.50,
        trial: true,
        obs: '(20% OFF)',
        nivel: 1,
        qtde_dias_trial: 5
      },
      {
        id: 4,
        nome: 'Basic',
        periodo: 'Anual',
        valor: 1198.80,
        desconto: 358.90,
        trial: true,
        obs: '(30% OFF)',
        nivel: 1,
        qtde_dias_trial: 5
      }
    ]
  }

  const { data, error } = await supabase
    .from('planos')
    .select('id, nome, periodo, valor, desconto, trial, obs, nivel, qtde_dias_trial')
    .order('id', { ascending: true })

  if (error) {
    console.error('Error fetching planos:', error)
    return []
  }

  return data || []
}

// Configurações do novo sistema de comissionamento
// Tipos para configuração de comissão com checkpoints
interface CheckpointConfig {
  checkpoint1: number // até 25% da meta
  checkpoint2: number // 26% a 60% da meta
  checkpoint3: number // 61% a 100%+ da meta
}

export interface ComissaoConfig {
  sdr: CheckpointConfig
  closer: CheckpointConfig
}

// Funções para configurações de comissão (usando localStorage por simplicidade)
export function getComissaoConfig(): ComissaoConfig {
  if (typeof window === 'undefined') {
    return {
      sdr: { checkpoint1: 3, checkpoint2: 5, checkpoint3: 7 },
      closer: { checkpoint1: 6, checkpoint2: 10, checkpoint3: 15 }
    }
  }
  
  const config = localStorage.getItem('comissao_config_checkpoints')
  if (!config) {
    return {
      sdr: { checkpoint1: 3, checkpoint2: 5, checkpoint3: 7 },
      closer: { checkpoint1: 6, checkpoint2: 10, checkpoint3: 15 }
    }
  }
  
  try {
    return JSON.parse(config)
  } catch {
    return {
      sdr: { checkpoint1: 3, checkpoint2: 5, checkpoint3: 7 },
      closer: { checkpoint1: 6, checkpoint2: 10, checkpoint3: 15 }
    }
  }
}

export function setComissaoConfig(config: ComissaoConfig) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('comissao_config_checkpoints', JSON.stringify(config))
}

// Função para calcular o checkpoint baseado no percentual da meta
export function calculateCheckpoint(percentualMeta: number): 0 | 1 | 2 | 3 {
  if (percentualMeta < 20) return 0  // Sem comissão
  if (percentualMeta < 65) return 1  // 1/3 dos valores fixos
  if (percentualMeta < 100) return 2 // 2/3 dos valores fixos
  return 3 // Valores fixos completos
}

// Função para obter o percentual de comissão baseado no checkpoint
export function getComissaoPercentual(funcao: string, checkpoint: 0 | 1 | 2 | 3, config: ComissaoConfig): number {
  if (checkpoint === 0) return 0 // Sem comissão
  
  const roleConfig = funcao.toLowerCase() === 'sdr' ? config.sdr : config.closer
  
  switch (checkpoint) {
    case 1: return roleConfig.checkpoint1
    case 2: return roleConfig.checkpoint2  
    case 3: return roleConfig.checkpoint3
    default: return 0
  }
}

// Função para obter informações do checkpoint
export function getCheckpointInfo(checkpoint: 0 | 1 | 2 | 3): { name: string; color: string; range: string } {
  switch (checkpoint) {
    case 0:
      return { name: 'Sem Comissão', color: 'bg-gray-500', range: '0-19%' }
    case 1:
      return { name: 'Checkpoint 1', color: 'bg-red-500', range: '20-64%' }
    case 2:
      return { name: 'Checkpoint 2', color: 'bg-blue-500', range: '65-99%' }
    case 3:
      return { name: 'Checkpoint 3', color: 'bg-green-500', range: '100%+' }
    default:
      return { name: 'Checkpoint 1', color: 'bg-slate-500', range: '0-25%' }
  }
}

// Interfaces para ranking
export interface TopCloser {
  id: number
  nome: string
  funcao: string
  totalVendas: number
  totalMRR: number
  numeroVendas: number
  percentualVendas: number
  vendasPorTipo: {
    mensal: { quantidade: number; valor: number }
    trimestral: { quantidade: number; valor: number }
    semestral: { quantidade: number; valor: number }
    anual: { quantidade: number; valor: number }
  }
}

export interface TopSDR {
  id: number
  nome: string
  totalReunioes: number
  reunioesQualificadas: number
  vendasGeradas: number
  totalMRRGerado: number
  percentualReunioes: number
}

// Função para calcular MRR baseado no tipo de plano
function calculateMRR(valorBase: number, tipoPlano: string): number {
  switch (tipoPlano) {
    case 'mensal': return valorBase
    case 'trimestral': return valorBase / 3
    case 'semestral': return valorBase / 6
    case 'anual': return valorBase / 12
    default: return valorBase
  }
}

const normalizeRole = (funcao?: string) => (funcao || '').toLowerCase()

const isSDRRole = (funcao?: string) => {
  const role = normalizeRole(funcao)
  return role === 'sdr' || role === 'sdr/closer'
}

const isCloserRole = (funcao?: string) => {
  const role = normalizeRole(funcao)
  return role === 'closer' || role === 'sdr/closer'
}

// Função para buscar top closers do banco
export async function getTopClosers(dataInicio?: string, dataFim?: string): Promise<TopCloser[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  try {
    // Buscar vendas sem JOIN com filtro por período
    // Observação: removido filtro que exigia closer_id não nulo para permitir considerar
    // vendas fechadas por colaboradores com função 'SDR/Closer' quando atuam sem um closer atribuído.
    let vendasQuery = supabase
      .from('clientes')
      .select('*')
      .eq('etapa', 'Vendas Realizadas')
      .not('data_fechamento', 'is', null)
      .not('valor_venda', 'is', null)
    
    if (dataInicio) {
      vendasQuery = vendasQuery.gte('data_fechamento', dataInicio)
    }
    if (dataFim) {
      vendasQuery = vendasQuery.lte('data_fechamento', dataFim)
    }
    
    const { data: vendas, error } = await vendasQuery

    if (error) {
      console.error('Error fetching closers:', error)
      return []
    }

    // Buscar colaboradores
    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('*')

    if (colaboradoresError) {
      console.error('Error fetching colaboradores for closers:', colaboradoresError)
      return []
    }

    if (!vendas || vendas.length === 0) {
      return []
    }

    // Criar map para lookup
    const colaboradoresMap = new Map()
    colaboradores?.forEach(colab => {
      colaboradoresMap.set(colab.id, colab)
    })

    // Agrupar vendas por closer
    const closersMap = new Map<number, {
      id: number
      nome: string
      funcao: string
      vendas: Array<{
        valor: number
        valorBase: number
        tipo: string
      }>
    }>()

    vendas.forEach((venda: any) => {
      // Primeiro tenta via closer_id
      let colaborador = venda.closer_id ? colaboradoresMap.get(venda.closer_id) : null
      let colaboradorId = venda.closer_id

      // Se não há closer_id mas há sdr_id, e o SDR tem função 'SDR/Closer', contar como venda dele
      if (!colaborador && venda.sdr_id) {
        const possivel = colaboradoresMap.get(venda.sdr_id)
        if (possivel && normalizeRole(possivel.funcao) === 'sdr/closer') {
          colaborador = possivel
          colaboradorId = venda.sdr_id
        }
      }

      if (colaborador && colaboradorId && isCloserRole(colaborador.funcao)) {
        if (!closersMap.has(colaboradorId)) {
          closersMap.set(colaboradorId, {
            id: colaboradorId,
            nome: colaborador.nome,
            funcao: colaborador.funcao,
            vendas: []
          })
        }
        closersMap.get(colaboradorId)?.vendas.push({
          valor: venda.valor_venda || 0,
          valorBase: venda.valor_base_plano || venda.valor_venda || 0,
          tipo: venda.tipo_plano || 'mensal'
        })
      }
    })

    // Calcular estatísticas para cada closer
    const totalGeralVendas = vendas.reduce((sum: number, v: any) => sum + (v.valor_venda || 0), 0)
    
    const topClosers: TopCloser[] = Array.from(closersMap.values()).map(closer => {
      const totalVendas = closer.vendas.reduce((sum, v) => sum + v.valor, 0)
      const totalMRR = closer.vendas.reduce((sum, v) => sum + calculateMRR(v.valorBase, v.tipo), 0)
      
      // Calcular vendas por tipo
      const vendasPorTipo = {
        mensal: { quantidade: 0, valor: 0 },
        trimestral: { quantidade: 0, valor: 0 },
        semestral: { quantidade: 0, valor: 0 },
        anual: { quantidade: 0, valor: 0 }
      }

      closer.vendas.forEach(venda => {
        const tipo = venda.tipo as keyof typeof vendasPorTipo
        if (vendasPorTipo[tipo]) {
          vendasPorTipo[tipo].quantidade++
          vendasPorTipo[tipo].valor += venda.valor
        }
      })

      return {
        id: closer.id,
        nome: closer.nome,
        funcao: closer.funcao,
        totalVendas,
        totalMRR,
        numeroVendas: closer.vendas.length,
        percentualVendas: totalGeralVendas > 0 ? (totalVendas / totalGeralVendas) * 100 : 0,
        vendasPorTipo
      }
    })

    // Ordenar por quantidade de vendas (número de vendas)
    return topClosers.sort((a, b) => b.numeroVendas - a.numeroVendas)
    
  } catch (error) {
    console.error('Error in getTopClosers:', error)
    return []
  }
}

// Função para buscar top SDRs do banco
export async function getTopSDRs(dataInicio?: string, dataFim?: string): Promise<TopSDR[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  try {
    // Buscar reuniões com filtro por período
    let reunioesQuery = supabase
      .from('reunioes')
      .select('*')
    
    if (dataInicio) {
      reunioesQuery = reunioesQuery.gte('data_reuniao', dataInicio)
    }
    if (dataFim) {
      reunioesQuery = reunioesQuery.lte('data_reuniao', dataFim)
    }
    
    const { data: reunioes, error: reunioesError } = await reunioesQuery

    if (reunioesError) {
      console.error('Error fetching reunioes:', reunioesError)
      return []
    }

    // Buscar colaboradores separadamente
    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('*')

    if (colaboradoresError) {
      console.error('Error fetching colaboradores:', colaboradoresError)
      return []
    }

    // Buscar vendas geradas por SDR (sem JOIN também) com filtro por período
    let vendasQuery = supabase
      .from('clientes')
      .select('*')
      .eq('etapa', 'Vendas Realizadas')
      .not('valor_venda', 'is', null)
      .not('sdr_id', 'is', null)
    
    if (dataInicio) {
      vendasQuery = vendasQuery.gte('data_fechamento', dataInicio)
    }
    if (dataFim) {
      vendasQuery = vendasQuery.lte('data_fechamento', dataFim)
    }
    
    const { data: vendas, error: vendasError } = await vendasQuery

    if (vendasError) {
      console.error('Error fetching vendas for SDR:', vendasError)
      return []
    }

    // Buscar TODOS os clientes para verificar etapas atuais das reuniões
    const { data: todosClientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, etapa, sdr_id, criado_em')

    if (clientesError) {
      console.error('Error fetching clientes for SDR validation:', clientesError)
      return []
    }

    // Criar maps para lookup rápido
    const colaboradoresMap = new Map()
    colaboradores?.forEach(colab => {
      colaboradoresMap.set(colab.id, colab)
    })

    // Agrupar por SDR
    const sdrsMap = new Map<number, {
      id: number
      nome: string
      reunioes: Array<{ tipo: string }>
      vendas: Array<{ valor: number; valorBase: number; tipo: string }>
      reunioesRealizadas: number
    }>()

    // Processar reuniões - APENAS de clientes em etapas válidas (se existirem)
    if (reunioes && reunioes.length > 0) {
      reunioes.forEach((reuniao: any) => {
  const colaborador = colaboradoresMap.get(reuniao.sdr_id)
  if (colaborador && isSDRRole(colaborador.funcao)) {
          // VERIFICAR SE CLIENTE ESTÁ EM ETAPA VÁLIDA
          if (reuniao.cliente_id) {
            const cliente = todosClientes?.find(c => c.id === reuniao.cliente_id)
            // Só contar se cliente existe E está em etapa válida para reuniões
            if (!cliente || !['Agendados', 'Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)) {
              return // Pular esta reunião
            }
          }
          
          const sdrId = reuniao.sdr_id
          if (!sdrsMap.has(sdrId)) {
            sdrsMap.set(sdrId, {
              id: sdrId,
              nome: colaborador.nome,
              reunioes: [],
              vendas: [],
              reunioesRealizadas: 0
            })
          }
          sdrsMap.get(sdrId)?.reunioes.push({ tipo: reuniao.tipo })
        }
      })
    }

    // Processar clientes para contar reuniões realizadas (que podem não estar na tabela reunioes)
    if (todosClientes && todosClientes.length > 0) {
      todosClientes.forEach((cliente: any) => {
        // Verificar se cliente está em etapa que indica reunião realizada
        if (['Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)) {
          // Aplicar filtro de período se especificado
          if (dataInicio || dataFim) {
            if (!cliente.criado_em) {
              return
            }
            
            const clienteDate = cliente.criado_em.split('T')[0] // Pegar apenas a data, sem timestamp
            if (dataInicio && clienteDate < dataInicio) {
              return
            }
            if (dataFim && clienteDate > dataFim) {
              return
            }
          }
          
          const sdrId = cliente.sdr_id
          
          if (sdrId) {
            const colaborador = colaboradoresMap.get(sdrId)
            
            if (colaborador && isSDRRole(colaborador.funcao)) {
              if (!sdrsMap.has(sdrId)) {
                sdrsMap.set(sdrId, {
                  id: sdrId,
                  nome: colaborador.nome,
                  reunioes: [],
                  vendas: [],
                  reunioesRealizadas: 0
                })
              }
              sdrsMap.get(sdrId)!.reunioesRealizadas++
            }
          }
        }
      })
    }

    // Processar vendas
    if (vendas) {
      vendas.forEach((venda: any) => {
  const colaborador = colaboradoresMap.get(venda.sdr_id)
  if (colaborador && isSDRRole(colaborador.funcao)) {
          const sdrId = venda.sdr_id
          if (sdrsMap.has(sdrId)) {
            sdrsMap.get(sdrId)?.vendas.push({
              valor: venda.valor_venda || 0,
              valorBase: venda.valor_base_plano || venda.valor_venda || 0,
              tipo: venda.tipo_plano || 'mensal'
            })
          } else {
            sdrsMap.set(sdrId, {
              id: sdrId,
              nome: colaborador.nome,
              reunioes: [],
              vendas: [{
                valor: venda.valor_venda || 0,
                valorBase: venda.valor_base_plano || venda.valor_venda || 0,
                tipo: venda.tipo_plano || 'mensal'
              }],
              reunioesRealizadas: 0
            })
          }
        }
      })
    }

    // Calcular estatísticas - APENAS reuniões válidas
    const reunioesValidas = reunioes.filter(reuniao => {
      if (!reuniao.cliente_id) return false
      const cliente = todosClientes?.find(c => c.id === reuniao.cliente_id)
      return cliente && ['Agendados', 'Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)
    })
    
    // Calcular total de reuniões considerando tanto reuniões na tabela quanto realizadas pelos clientes
    const totalReunioesMarcadas = Array.from(sdrsMap.values()).reduce((sum, sdr) => {
      return sum + Math.max(sdr.reunioes.length, sdr.reunioesRealizadas)
    }, 0)
    
    const topSDRs: TopSDR[] = Array.from(sdrsMap.values()).map(sdr => {
      const reunioesQualificadas = sdr.reunioes.filter(r => r.tipo === 'qualificada').length
      const vendasGeradas = sdr.vendas.length
      const totalMRRGerado = sdr.vendas.reduce((sum, v) => sum + calculateMRR(v.valorBase, v.tipo), 0)
      
      // Total de reuniões = MAX entre reuniões na tabela e reuniões realizadas pelos clientes
      const totalReunioesSdr = Math.max(sdr.reunioes.length, sdr.reunioesRealizadas)

      return {
        id: sdr.id,
        nome: sdr.nome,
        totalReunioes: totalReunioesSdr,
        reunioesQualificadas,
        vendasGeradas,
        totalMRRGerado,
        percentualReunioes: totalReunioesMarcadas > 0 ? (totalReunioesSdr / totalReunioesMarcadas) * 100 : 0
      }
    })

    // Ordenar por número total de reuniões (não por MRR)
    return topSDRs.sort((a, b) => b.totalReunioes - a.totalReunioes)
  } catch (error) {
    console.error('Error in getTopSDRs:', error)
    return []
  }
}

// Função para buscar todos os clientes
export async function getAllClientes() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Using mock data.')
    // Mock data para desenvolvimento
    return [
      {
        id: 1,
        nome: 'Cliente Teste',
        sdr_id: 1,
        closer_id: 2,
        etapa: 'Vendas Realizadas',
        valor_venda: 150.00,
        tipo_plano: 'mensal',
        valor_base_plano: 99.90,
        data_fechamento: '2025-01-06'
      }
    ]
  }

  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('Error fetching clientes:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return []
  }
}

// Funções para gerenciar reuniões
export async function createReuniao(clienteId: number, sdrId: number, tipo: 'qualificada' | 'gerou_venda', dataReuniao: Date) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured.')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('reunioes')
      .insert([
        {
          cliente_id: clienteId,
          sdr_id: sdrId,
          tipo: tipo,
          data_reuniao: dataReuniao.toISOString().split('T')[0]
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating reuniao:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating reuniao:', error)
    return null
  }
}

export async function getReunioesBySDR(sdrId: number) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured.')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('reunioes')
      .select('*')
      .eq('sdr_id', sdrId)

    if (error) {
      console.error('Error fetching reunioes:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching reunioes:', error)
    return []
  }
}

export async function getAllReunioes() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured.')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('reunioes')
      .select('*')

    if (error) {
      console.error('Error fetching all reunioes:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching all reunioes:', error)
    return []
  }
}

// Função para buscar estatísticas reais para Meta Ads Performance
// Função para calcular meta individual de cada colaborador
export async function getMetasIndividuais() {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      metaIndividualCloser: 200000, // Meta padrão
      metaIndividualSDR: 25 // Meta padrão
    }
  }

  try {
    // Buscar meta atual e colaboradores
    const [metasResult, metasSdrResult, colaboradoresResult] = await Promise.all([
      getCurrentMonthMeta(),
      getCurrentMonthMetaSdr(),
      supabase.from('colaboradores').select('*')
    ])

    if (colaboradoresResult.error) {
      console.error('Error fetching colaboradores:', colaboradoresResult.error)
      return {
        metaIndividualCloser: 200000,
        metaIndividualSDR: 25
      }
    }

  const colaboradores = colaboradoresResult.data || []
  const closers = colaboradores.filter(c => isCloserRole(c.funcao))
  const sdrs = colaboradores.filter(c => isSDRRole(c.funcao))

    const metaComercial = metasResult?.valor_meta || 200000
    const metaSDR = metasSdrResult?.valor_meta || 50

    return {
      metaIndividualCloser: closers.length > 0 ? metaComercial / closers.length : metaComercial,
      metaIndividualSDR: sdrs.length > 0 ? metaSDR / sdrs.length : metaSDR,
      totalClosers: closers.length,
      totalSDRs: sdrs.length
    }
  } catch (error) {
    console.error('Error calculating individual metas:', error)
    return {
      metaIndividualCloser: 200000,
      metaIndividualSDR: 25
    }
  }
}

// Cache para evitar criar reuniões duplicadas na mesma sessão
const reunioesCriadas = new Set<string>()

// Função para criar reunião automaticamente quando venda é fechada
async function createReuniaoFromVenda(venda: any) {
  if (!isSupabaseConfigured() || !supabase || !venda.sdr_id) {
    return
  }

  const cacheKey = `${venda.id}_${venda.sdr_id}`
  if (reunioesCriadas.has(cacheKey)) {
    return // Já foi processada nesta sessão
  }

  try {
    // Verificar se já existe reunião para esta venda - query mais simples
    const { data: existingReunioes, error: searchError } = await supabase
      .from('reunioes')
      .select('id')
      .eq('cliente_id', venda.id)
      .eq('sdr_id', venda.sdr_id)

    if (searchError) {
      console.warn('Erro ao verificar reunião existente, pulando criação:', searchError.message)
      return
    }

    if (!existingReunioes || existingReunioes.length === 0) {
      // Criar reunião que gerou venda
      const { error } = await supabase
        .from('reunioes')
        .insert([{
          cliente_id: venda.id,
          sdr_id: venda.sdr_id,
          tipo: 'gerou_venda',
          data_reuniao: venda.data_fechamento || venda.atualizado_em || new Date().toISOString().split('T')[0]
        }])

      if (!error) {
        reunioesCriadas.add(cacheKey)
        console.log('Reunião criada automaticamente para venda:', venda.id)
      } else {
        console.warn('Erro ao criar reunião:', error.message)
      }
    } else {
      reunioesCriadas.add(cacheKey) // Marcar como processada
    }
  } catch (error) {
    console.error('Erro ao criar reunião automática:', error)
  }
}

// Função para deletar cliente
export async function deleteCliente(id: number) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured.')
    return { success: false, error: 'Supabase não configurado' }
  }

  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting cliente:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting cliente:', error)
    return { success: false, error: 'Erro ao deletar cliente' }
  }
}

export async function getMetaAdsRealStats(startDate?: string, endDate?: string) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured.')
    return {
      reunioesMarcadas: 0,
      reunioesRealizadas: 0,
      novosFechamentos: 0
    }
  }

  try {
    // Se não foram fornecidas datas, usar o mês atual
    let fromDate: string
    let toDate: string
    
    if (startDate && endDate) {
      fromDate = startDate
      toDate = endDate + 'T23:59:59'
    } else {
      const currentDate = new Date()
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      fromDate = firstDayOfMonth.toISOString().split('T')[0]
      toDate = currentDate.toISOString().split('T')[0] + 'T23:59:59'
    }

    // Buscar clientes criados no período
    const { data: clientesDoPeriodo, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .gte('criado_em', fromDate)
      .lte('criado_em', toDate)

    if (clientesError) {
      console.error('Error fetching clientes do período:', clientesError)
    }

    // Buscar reuniões marcadas no período
    const { data: reunioesDoPeriodo, error: reunioesError } = await supabase
      .from('reunioes')
      .select('*')
      .gte('data_reuniao', fromDate)
      .lte('data_reuniao', toDate)

    if (reunioesError) {
      console.error('Error fetching reuniões do período:', reunioesError)
    }

    // Reuniões marcadas = clientes com etapa "Agendados"
    const reunioesMarcadas = clientesDoPeriodo?.filter(cliente => 
      cliente.etapa === 'Agendados'
    ).length || 0
    
    // Reuniões realizadas = clientes com etapa "Reunioes Feitas" ou "Vendas Realizadas"
    const reunioesRealizadas = clientesDoPeriodo?.filter(cliente => 
      cliente.etapa === 'Reunioes Feitas' || cliente.etapa === 'Vendas Realizadas'
    ).length || 0
    
    // Novos fechamentos = clientes com vendas realizadas no período
    const novosFechamentos = clientesDoPeriodo?.filter(cliente => 
      cliente.etapa === 'Vendas Realizadas' && cliente.valor_venda && cliente.valor_venda > 0
    ).length || 0

    return {
      reunioesMarcadas,
      reunioesRealizadas,
      novosFechamentos
    }
  } catch (error) {
    console.error('Error fetching Meta Ads real stats:', error)
    return {
      reunioesMarcadas: 0,
      reunioesRealizadas: 0,
      novosFechamentos: 0
    }
  }
}


