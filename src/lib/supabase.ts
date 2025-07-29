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
export async function getClientes() {
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
    .select('*')
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

  const vendasFechadas = clientes.filter(c => c.etapa === 'Fechado - Ganhou')
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
    .eq('etapa', 'Fechado - Ganhou')
  
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
      .eq('etapa', 'Fechado - Ganhou')
    
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
      .eq('etapa', 'Fechado - Ganhou')
    
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
      .eq('etapa', 'Fechado - Ganhou')
    
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
      'Prospecção': 0,
      'Contato Feito': 0,
      'Reunião Agendada': 0,
      'Proposta Enviada': 0,
      'Fechado - Ganhou': 0,
      'Fechado - Perdido': 0
    }

    clientes.forEach(cliente => {
      if (stageCounts.hasOwnProperty(cliente.etapa)) {
        stageCounts[cliente.etapa as keyof typeof stageCounts]++
      }
    })

    const totalLeads = clientes.length
    const activeLeads = totalLeads - stageCounts['Fechado - Ganhou'] - stageCounts['Fechado - Perdido']
    const meetings = stageCounts['Reunião Agendada'] + stageCounts['Proposta Enviada']
    const sales = stageCounts['Fechado - Ganhou']

    return [
      {
        stage: "Leads",
        value: totalLeads,
        percentage: 100,
        color: "#22c55e"
      },
      {
        stage: "Reuniões",
        value: meetings,
        percentage: totalLeads > 0 ? (meetings / totalLeads) * 100 : 0,
        color: "#16a34a"
      },
      {
        stage: "Vendas",
        value: sales,
        percentage: totalLeads > 0 ? (sales / totalLeads) * 100 : 0,
        color: "#15803d"
      },
      {
        stage: "Follow",
        value: activeLeads,
        percentage: totalLeads > 0 ? (activeLeads / totalLeads) * 100 : 0,
        color: "#166534"
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
        if (!['Prospecção', 'Fechado - Perdido'].includes(cliente.etapa)) {
          monthData.leadsQualificados++
        }
        
        // Count meetings scheduled
        if (['Reunião Agendada', 'Proposta Enviada', 'Fechado - Ganhou'].includes(cliente.etapa)) {
          monthData.reunioesMarcadas++
        }
        
        // Count sales
        if (cliente.etapa === 'Fechado - Ganhou') {
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
      .select('*')
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
    
    return meta
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
    // First try to update existing record
    const { data: existingMeta, error: fetchError } = await supabase
      .from('metas')
      .select('*')
      .eq('ano', ano)
      .eq('mes', mes)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing meta:', fetchError)
      return { success: false, error: fetchError.message }
    }

    const { data, error } = await supabase
      .from('metas')
      .upsert({
        ano,
        mes,
        meta_comercial: valor_meta,
        meta_closer: existingMeta?.meta_closer || 0,
        meta_sdr: existingMeta?.meta_sdr || 0,
        meta_diaria: existingMeta?.meta_diaria || 0
      }, {
        onConflict: 'ano,mes'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting meta:', error)
      return { success: false, error: error.message }
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
      .select('*')
      .eq('ano', ano)
      .eq('mes', mes)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing meta:', fetchError)
      return { success: false, error: fetchError.message }
    }

    const { data, error } = await supabase
      .from('metas')
      .upsert({
        ano,
        mes,
        meta_comercial: existingMeta?.meta_comercial || 0,
        meta_closer: valor_meta,
        meta_sdr: existingMeta?.meta_sdr || 0,
        meta_diaria: existingMeta?.meta_diaria || 0
      }, {
        onConflict: 'ano,mes'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting meta closer:', error)
      return { success: false, error: error.message }
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
      .select('*')
      .eq('ano', ano)
      .eq('mes', mes)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing meta:', fetchError)
      return { success: false, error: fetchError.message }
    }

    const { data, error } = await supabase
      .from('metas')
      .upsert({
        ano,
        mes,
        meta_comercial: existingMeta?.meta_comercial || 0,
        meta_closer: existingMeta?.meta_closer || 0,
        meta_sdr: valor_meta,
        meta_diaria: existingMeta?.meta_diaria || 0
      }, {
        onConflict: 'ano,mes'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting meta SDR:', error)
      return { success: false, error: error.message }
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
  sdr_id?: string | null
  closer_id?: string | null
  etapa: Database['public']['Enums']['etapa_enum']
  endereco?: string | null
  valor_venda?: number | null
}) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Cannot create client.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([clienteData])
      .select()
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
  sdr_id?: string | null
  closer_id?: string | null
  etapa?: Database['public']['Enums']['etapa_enum']
  endereco?: string | null
  valor_venda?: number | null
}) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. Cannot update client.')
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(clienteData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateCliente:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}
