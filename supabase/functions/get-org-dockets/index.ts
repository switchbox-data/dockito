import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetOrgDocketsRequest {
  orgName: string
  filters?: {
    startDate?: string
    endDate?: string
    sortBy?: 'opened_date' | 'docket_count'
    sortOrder?: 'asc' | 'desc'
    industries?: string[]
    docketTypes?: string[]
  }
  aggregateOnly?: boolean
  pagination?: {
    page?: number
    limit?: number
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { orgName, filters, aggregateOnly, pagination } = await req.json() as GetOrgDocketsRequest

    console.log('Getting dockets for org:', orgName)

    // First get the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('uuid')
      .eq('name', orgName)
      .single()

    if (orgError) {
      console.error('Error finding organization:', orgError)
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const orgId = org.uuid

    if (aggregateOnly) {
      // Use a single JOIN query for better performance instead of chunking
      let query = supabase
        .from('docket_petitioned_by_org')
        .select(`
          dockets!inner(
            opened_date,
            industry,
            docket_type
          )
        `)
        .eq('petitioner_uuid', orgId)

      // Apply date filters directly in the query
      if (filters?.startDate) {
        query = query.gte('dockets.opened_date', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('dockets.opened_date', filters.endDate)
      }

      const { data: aggregateData, error: aggregateError } = await query

      if (aggregateError) {
        console.error('Error getting aggregate data:', aggregateError)
        return new Response(
          JSON.stringify({ error: 'Failed to get aggregate data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const dockets = aggregateData?.map(rel => rel.dockets).flat() || []
      console.log(`Found ${dockets.length} dockets for aggregation for org ${orgName}`)

      if (dockets.length === 0) {
        return new Response(
          JSON.stringify({
            dateBounds: { min: null, max: null },
            industries: [],
            docketTypes: [],
            totalCount: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate aggregates efficiently
      const dates = dockets
        .map(d => d.opened_date)
        .filter(date => date)
        .sort()

      const dateBounds = dates.length > 0 ? {
        min: dates[0],
        max: dates[dates.length - 1]
      } : { min: null, max: null }

      const industryMap = new Map<string, number>()
      const typeMap = new Map<string, number>()

      dockets.forEach(d => {
        if (d.industry) {
          industryMap.set(d.industry, (industryMap.get(d.industry) || 0) + 1)
        }
        if (d.docket_type) {
          typeMap.set(d.docket_type, (typeMap.get(d.docket_type) || 0) + 1)
        }
      })

      return new Response(
        JSON.stringify({
          dateBounds,
          industries: Array.from(industryMap.entries()).map(([industry, count]) => ({ industry, count })),
          docketTypes: Array.from(typeMap.entries()).map(([docket_type, count]) => ({ docket_type, count })),
          totalCount: dockets.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Main docket query with server-side pagination for better performance
    const page = pagination?.page || 1
    const limit = pagination?.limit || 50
    const offset = (page - 1) * limit

    let query = supabase
      .from('docket_petitioned_by_org')
      .select(`
        dockets!inner(
          uuid,
          docket_govid,
          docket_title,
          docket_description,
          opened_date,
          closed_date,
          current_status,
          industry,
          docket_type,
          docket_subtype,
          assigned_judge,
          hearing_officer,
          petitioner_strings
        )
      `)
      .eq('petitioner_uuid', orgId)

    // Apply filters to the dockets relation
    if (filters?.startDate) {
      query = query.gte('dockets.opened_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('dockets.opened_date', filters.endDate)
    }
    if (filters?.industries && filters.industries.length > 0) {
      query = query.in('dockets.industry', filters.industries)
    }
    if (filters?.docketTypes && filters.docketTypes.length > 0) {
      query = query.in('dockets.docket_type', filters.docketTypes)
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'opened_date'
    const sortOrder = filters?.sortOrder || 'desc'
    
    if (sortOrder === 'asc') {
      query = query.order(`dockets.${sortBy}`, { ascending: true })
    } else {
      query = query.order(`dockets.${sortBy}`, { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: docketData, error: docketError } = await query

    if (docketError) {
      console.error('Error getting dockets:', docketError)
      return new Response(
        JSON.stringify({ error: 'Failed to get dockets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const dockets = docketData?.map(rel => rel.dockets).flat() || []
    console.log(`Found ${dockets.length} dockets for org ${orgName} (page ${page})`)

    // Get total count for pagination metadata (only if it's the first page to avoid extra queries)
    let totalCount = 0
    if (page === 1) {
      const { count, error: countError } = await supabase
        .from('docket_petitioned_by_org')
        .select('*', { count: 'exact', head: true })
        .eq('petitioner_uuid', orgId)

      if (!countError) {
        totalCount = count || 0
      }
    }

    const response = {
      dockets,
      pagination: {
        page,
        limit,
        totalCount: page === 1 ? totalCount : null, // Only include on first page
        totalPages: page === 1 ? Math.ceil(totalCount / limit) : null,
        hasNextPage: dockets.length === limit, // If we got a full page, assume there might be more
        hasPreviousPage: page > 1
      }
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})