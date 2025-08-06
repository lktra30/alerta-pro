import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if environment variables are properly configured
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

  const { data, error } = await supabase
    .from('clientes')
    .update({ etapa })
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
          month: 'short', 
          year: '2-digit' 
        }).replace('.', ' de ')
        
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
        const aDate = new Date(a.month.replace(' de ', '/'))
        const bDate = new Date(b.month.replace(' de ', '/'))
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
export async function getFunnelData() {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Please add environment variables.')
    return []
  }

  try {
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('etapa')
    
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
      'Leads Qualificados': 0,
      'Agendados': 0,
      'Reunioes Feitas': 0,
      'Vendas Realizadas': 0
    }

    clientes.forEach(cliente => {
      if (stageCounts.hasOwnProperty(cliente.etapa)) {
        stageCounts[cliente.etapa as keyof typeof stageCounts]++
      }
    })

    const totalLeads = clientes.length
    const leadsQualificados = stageCounts['Leads Qualificados']
    const agendados = stageCounts['Agendados']
    const reunioesFeitas = stageCounts['Reunioes Feitas']
    const vendasRealizadas = stageCounts['Vendas Realizadas']

    return [
      {
        stage: "Leads",
        value: totalLeads,
        percentage: 100,
        color: "#22c55e"
      },
      {
        stage: "Leads Qualificados",
        value: leadsQualificados,
        percentage: totalLeads > 0 ? (leadsQualificados / totalLeads) * 100 : 0,
        color: "#16a34a"
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
      }
    ]
  } catch (error) {
    console.error('Error in getFunnelData:', error)
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
          month: 'short', 
          year: '2-digit' 
        }).replace('.', ' de ')
        
        if (!monthlyLeads.has(monthKey)) {
          monthlyLeads.set(monthKey, {
            month: monthLabel,
            leadsTotal: 0,
            leadsQualificados: 0,
            reunioesMarcadas: 0,
            vendas: 0
          })
        }
        
        const monthData = monthlyLeads.get(monthKey)
        monthData.leadsTotal++
        
        // Count qualified leads (beyond first contact)
        if (['Leads Qualificados', 'Agendados', 'Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)) {
          monthData.leadsQualificados++
        }
        
        // Count meetings scheduled
        if (['Agendados', 'Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)) {
          monthData.reunioesMarcadas++
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
        const aDate = new Date(a.month.replace(' de ', '/'))
        const bDate = new Date(b.month.replace(' de ', '/'))
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
    console.warn('Supabase not configured, using default meta values')
    return { valor_meta: 800000, ano: 2025, mes: 7 } // Default values
  }

  try {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const { data: meta, error } = await supabase
      .from('metas')
      .select('id, ano, mes, valor_meta, meta_closer, meta_sdr')
      .eq('ano', currentYear)
      .eq('mes', currentMonth)
      .single()
    
    if (error) {
      // Check if it's a "no rows" error (which is expected when no meta exists)
      if (error.code === 'PGRST116') {
        console.info(`No meta found for ${currentYear}/${currentMonth}, using default values`)
      } else {
        console.error('Supabase error fetching meta:', error.code, error.message)
      }
      return { valor_meta: 800000, ano: currentYear, mes: currentMonth }
    }

    if (!meta) {
      console.info(`No meta data returned for ${currentYear}/${currentMonth}, using default values`)
      return { valor_meta: 800000, ano: currentYear, mes: currentMonth }
    }
    
    console.log('Meta data from database:', meta)
    console.log('Meta keys:', Object.keys(meta))
    
    // Return the meta object with the correct valor_meta field
    return {
      valor_meta: meta.valor_meta || 800000,
      ano: meta.ano,
      mes: meta.mes
    }
  } catch (error) {
    console.error('Error in getCurrentMonthMeta:', error)
    return { valor_meta: 800000, ano: 2025, mes: 7 } // Default values
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
    console.warn('Supabase not configured, using default meta SDR values')
    return { valor_meta: 50, ano: 2025, mes: 7 } // Default values
  }

  try {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const { data: meta, error } = await supabase
      .from('metas')
      .select('meta_sdr, ano, mes')
      .eq('ano', currentYear)
      .eq('mes', currentMonth)
      .single()
    
    if (error) {
      // Check if it's a "no rows" error (which is expected when no meta exists)
      if (error.code === 'PGRST116') {
        console.info(`No meta SDR found for ${currentYear}/${currentMonth}, using default values`)
      } else {
        console.error('Supabase error fetching meta SDR:', error.code, error.message)
      }
      return { valor_meta: 50, ano: currentYear, mes: currentMonth }
    }

    if (!meta) {
      console.info(`No meta SDR data returned for ${currentYear}/${currentMonth}, using default values`)
      return { valor_meta: 50, ano: currentYear, mes: currentMonth }
    }
    
    return {
      valor_meta: meta.meta_sdr || 50,
      ano: meta.ano,
      mes: meta.mes
    }
  } catch (error) {
    console.error('Error in getCurrentMonthMetaSdr:', error)
    return { valor_meta: 50, ano: 2025, mes: 7 } // Default values
  }
}

// Function to create or update meta
export async function upsertMeta(ano: number, mes: number, valor_meta: number) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Using local state only.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // Test if the table exists and is accessible
    const { error: testError } = await supabase
      .from('metas')
      .select('id, ano, mes, valor_meta, meta_closer, meta_sdr')
      .limit(1)
    
    if (testError) {
      console.error('Error accessing metas table:', testError)
      return { success: false, error: `Table access error: ${testError.message}` }
    }

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
      valor_meta: valor_meta,
      meta_closer: existingMeta?.meta_closer || 0,
      meta_sdr: existingMeta?.meta_sdr || 0
    }

    console.log('Upserting meta with data:', upsertData)

    const { data, error } = await supabase
      .from('metas')
      .upsert(upsertData, {
        onConflict: 'ano,mes'
      })
      .select('id, ano, mes, valor_meta, meta_closer, meta_sdr')
      .single()

    if (error) {
      console.error('Error upserting meta - Full error object:', JSON.stringify(error, null, 2))
      console.error('Error upserting meta - Error type:', typeof error)
      console.error('Error upserting meta - Error keys:', Object.keys(error))
      console.error('Error upserting meta - Upsert data:', upsertData)
      
      const errorMessage = error.message || 'Unknown database error - check console for details'
      return { success: false, error: errorMessage }
    }

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

// Function to create or update meta SDR
export async function upsertMetaSdr(ano: number, mes: number, valor_meta: number) {
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
      meta_closer: existingMeta?.meta_closer || 0,
      meta_sdr: valor_meta
    }

    console.log('Upserting meta SDR with data:', upsertData)

    const { data, error } = await supabase
      .from('metas')
      .upsert(upsertData, {
        onConflict: 'ano,mes'
      })
      .select('id, ano, mes, valor_meta, meta_closer, meta_sdr')
      .single()

    if (error) {
      console.error('Error upserting meta SDR:', {
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
      
      // If it's a schema cache error, try alternative approach
      if (error.code === 'PGRST204') {
        console.log('Schema cache error detected during creation. Trying alternative approach...')
        
        // Try creating without the problematic fields first, then add them
        const { closer_id, sdr_id, ...safeData } = clienteData
        
        const { data: partialData, error: partialError } = await supabase
          .from('clientes')
          .insert([safeData])
          .select('*')
          .single()

        if (partialError) {
          return { success: false, error: `Primary creation failed: ${partialError.message}` }
        }

        // Now try to update with the collaborator IDs if they were provided
        if (closer_id !== undefined || sdr_id !== undefined) {
          const collaboratorUpdate: { sdr_id?: number | null; closer_id?: number | null } = {}
          if (sdr_id !== undefined) collaboratorUpdate.sdr_id = sdr_id
          if (closer_id !== undefined) collaboratorUpdate.closer_id = closer_id

          const { data: finalData, error: finalError } = await supabase
            .from('clientes')
            .update(collaboratorUpdate)
            .eq('id', partialData.id)
            .select('*')
            .single()

          if (finalError) {
            console.warn('Collaborator assignment failed, but client was created:', finalError)
            return { 
              success: true, 
              data: partialData, 
              warning: `Client created but collaborator assignment failed: ${finalError.message}` 
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
export async function getAdvancedDashboardStats() {
  if (!isSupabaseConfigured() || !supabase) {
    // Mock data para desenvolvimento
    const currentDate = new Date()
    const workingDays = getWorkingDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)
    const currentDay = currentDate.getDate()
    const workingDaysElapsed = Math.min(currentDay, workingDays)
    
    return {
      totalFaturamento: 94250,
      metaMensal: 50000,
      metaDiaria: 50000 / workingDays,
      faturamentoDiario: 6200,
      progressoMetaDiaria: (6200 / (50000 / workingDays)) * 100,
      diasUteis: workingDays,
      diasUteisDecorridos: workingDaysElapsed,
      ticketMedio: 3927.08,
      totalVendas: 24,
      totalInvestido: 41054.40,
      cac: 1710.60,
      roas: 2.3,
      clientesAdquiridos: 24,
      totalReunioesMarcadas: 35,
      metaReunioesSdr: 50,
      planosMensais: 8,
      planosTrimestrais: 6,
      planosSemestrais: 5,
      planosAnuais: 5
    }
  }

  try {
    const [clientes, metas, metasSdr, reunioes] = await Promise.all([
      supabase.from('clientes').select('*'),
      supabase.from('metas').select('*').order('ano', { ascending: false }).order('mes', { ascending: false }).limit(1),
      supabase.from('metas_sdr').select('*').order('ano', { ascending: false }).order('mes', { ascending: false }).limit(1),
      supabase.from('reunioes').select('*')
    ])

    const vendas = clientes.data?.filter(c => c.data_fechamento && c.valor_venda) || []
    const totalFaturamento = vendas.reduce((sum, v) => sum + (v.valor_venda || 0), 0)
    const metaMensal = metas.data?.[0]?.valor_meta || 50000
    const metaReunioesSdr = metasSdr.data?.[0]?.valor_meta || 50
    
    // Contar planos por tipo
    const planosMensais = vendas.filter(v => v.tipo_plano === 'mensal').length
    const planosTrimestrais = vendas.filter(v => v.tipo_plano === 'trimestral').length
    const planosSemestrais = vendas.filter(v => v.tipo_plano === 'semestral').length
    const planosAnuais = vendas.filter(v => v.tipo_plano === 'anual').length
    
    // Contar reuniões marcadas do mês atual
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    
    const reunioesDoMes = reunioes.data?.filter(r => {
      if (!r.data_reuniao) return false
      const reuniaoDate = new Date(r.data_reuniao)
      return reuniaoDate.getMonth() + 1 === currentMonth && reuniaoDate.getFullYear() === currentYear
    }) || []
    
    const totalReunioesMarcadas = reunioesDoMes.length
    
    const workingDays = getWorkingDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)
    const currentDay = currentDate.getDate()
    const workingDaysElapsed = Math.min(currentDay, workingDays)
    
    const metaDiaria = metaMensal / workingDays
    const faturamentoDiario = totalFaturamento / workingDaysElapsed
    
    return {
      totalFaturamento,
      metaMensal,
      metaDiaria,
      faturamentoDiario,
      progressoMetaDiaria: (faturamentoDiario / metaDiaria) * 100,
      diasUteis: workingDays,
      diasUteisDecorridos: workingDaysElapsed,
      ticketMedio: vendas.length > 0 ? totalFaturamento / vendas.length : 0,
      totalVendas: vendas.length,
      totalInvestido: 41054.40, // Mock data - integrar com Meta Ads
      cac: vendas.length > 0 ? 41054.40 / vendas.length : 0,
      roas: 41054.40 > 0 ? totalFaturamento / 41054.40 : 0,
      clientesAdquiridos: vendas.length,
      totalReunioesMarcadas,
      metaReunioesSdr,
      planosMensais,
      planosTrimestrais,
      planosSemestrais,
      planosAnuais
    }
  } catch (error) {
    console.error('Error getting advanced dashboard stats:', error)
    return {
      totalFaturamento: 0,
      metaMensal: 0,
      metaDiaria: 0,
      faturamentoDiario: 0,
      progressoMetaDiaria: 0,
      diasUteis: 0,
      diasUteisDecorridos: 0,
      ticketMedio: 0,
      totalVendas: 0,
      totalInvestido: 0,
      cac: 0,
      roas: 0,
      clientesAdquiridos: 0,
      totalReunioesMarcadas: 0,
      metaReunioesSdr: 50,
      planosMensais: 0,
      planosTrimestrais: 0,
      planosSemestrais: 0,
      planosAnuais: 0
    }
  }
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

// Função para buscar top closers do banco
export async function getTopClosers(): Promise<TopCloser[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  try {
    // Buscar vendas sem JOIN
    const { data: vendas, error } = await supabase
      .from('clientes')
      .select('*')
      .not('data_fechamento', 'is', null)
      .not('valor_venda', 'is', null)
      .not('closer_id', 'is', null)

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
      vendas: Array<{
        valor: number
        valorBase: number
        tipo: string
      }>
    }>()

    vendas.forEach((venda: any) => {
      const colaborador = colaboradoresMap.get(venda.closer_id)
      if (colaborador && colaborador.funcao.toLowerCase() === 'closer') {
        const closerId = venda.closer_id
        if (!closersMap.has(closerId)) {
          closersMap.set(closerId, {
            id: closerId,
            nome: colaborador.nome,
            vendas: []
          })
        }
        closersMap.get(closerId)?.vendas.push({
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
        totalVendas,
        totalMRR,
        numeroVendas: closer.vendas.length,
        percentualVendas: totalGeralVendas > 0 ? (totalVendas / totalGeralVendas) * 100 : 0,
        vendasPorTipo
      }
    })

    // Ordenar por total de MRR
    return topClosers.sort((a, b) => b.totalMRR - a.totalMRR)
    
  } catch (error) {
    console.error('Error in getTopClosers:', error)
    return []
  }
}

// Função para buscar top SDRs do banco
export async function getTopSDRs(): Promise<TopSDR[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  try {
    // Buscar reuniões com dados do colaborador (sem JOIN first para testar)
    const { data: reunioes, error: reunioesError } = await supabase
      .from('reunioes')
      .select('*')

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

    // Buscar vendas geradas por SDR (sem JOIN também)
    const { data: vendas, error: vendasError } = await supabase
      .from('clientes')
      .select('*')
      .not('data_fechamento', 'is', null)
      .not('valor_venda', 'is', null)
      .not('sdr_id', 'is', null)

    if (vendasError) {
      console.error('Error fetching vendas for SDR:', vendasError)
      return []
    }

    if (!reunioes || reunioes.length === 0) {
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
    }>()

    // Processar reuniões
    reunioes.forEach((reuniao: any) => {
      const colaborador = colaboradoresMap.get(reuniao.sdr_id)
      if (colaborador && colaborador.funcao.toLowerCase() === 'sdr') {
        const sdrId = reuniao.sdr_id
        if (!sdrsMap.has(sdrId)) {
          sdrsMap.set(sdrId, {
            id: sdrId,
            nome: colaborador.nome,
            reunioes: [],
            vendas: []
          })
        }
        sdrsMap.get(sdrId)?.reunioes.push({ tipo: reuniao.tipo })
      }
    })

    // Processar vendas
    if (vendas) {
      vendas.forEach((venda: any) => {
        const colaborador = colaboradoresMap.get(venda.sdr_id)
        if (colaborador && colaborador.funcao.toLowerCase() === 'sdr') {
          const sdrId = venda.sdr_id
          if (sdrsMap.has(sdrId)) {
            sdrsMap.get(sdrId)?.vendas.push({
              valor: venda.valor_venda || 0,
              valorBase: venda.valor_base_plano || venda.valor_venda || 0,
              tipo: venda.tipo_plano || 'mensal'
            })
          }
        }
      })
    }

    // Calcular estatísticas
    const totalReunioes = reunioes.length
    
    const topSDRs: TopSDR[] = Array.from(sdrsMap.values()).map(sdr => {
      const reunioesQualificadas = sdr.reunioes.filter(r => r.tipo === 'qualificada').length
      const vendasGeradas = sdr.vendas.length
      const totalMRRGerado = sdr.vendas.reduce((sum, v) => sum + calculateMRR(v.valorBase, v.tipo), 0)

      return {
        id: sdr.id,
        nome: sdr.nome,
        totalReunioes: sdr.reunioes.length,
        reunioesQualificadas,
        vendasGeradas,
        totalMRRGerado,
        percentualReunioes: totalReunioes > 0 ? (sdr.reunioes.length / totalReunioes) * 100 : 0
      }
    })

    // Ordenar por MRR gerado
    return topSDRs.sort((a, b) => b.totalMRRGerado - a.totalMRRGerado)
    
  } catch (error) {
    console.error('Error in getTopSDRs:', error)
    return []
  }
}
