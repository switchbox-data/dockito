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
  }
  aggregateOnly?: boolean
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

    const { orgName, filters, aggregateOnly } = await req.json() as GetOrgDocketsRequest

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
      // For aggregates, get all the docket UUIDs first
      const { data: docketUuids, error: docketUuidsError } = await supabase
        .from('docket_petitioned_by_org')
        .select('docket_uuid')
        .eq('petitioner_uuid', orgId)

      if (docketUuidsError) {
        console.error('Error getting docket UUIDs:', docketUuidsError)
        throw docketUuidsError
      }

      const uuids = docketUuids.map(d => d.docket_uuid)
      if (uuids.length === 0) {
        return new Response(
          JSON.stringify({
            dateBounds: { min: null, max: null },
            industries: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get date bounds
      const [{ data: minData }, { data: maxData }] = await Promise.all([
        supabase
          .from('dockets')
          .select('opened_date')
          .in('uuid', uuids)
          .order('opened_date', { ascending: true })
          .limit(1),
        supabase
          .from('dockets')
          .select('opened_date')
          .in('uuid', uuids)
          .order('opened_date', { ascending: false })
          .limit(1)
      ])

      // Get industry data
      let industryQuery = supabase
        .from('dockets')
        .select('industry')
        .in('uuid', uuids)
        .not('industry', 'is', null)
        .neq('industry', '')

      if (filters?.startDate) {
        industryQuery = industryQuery.gte('opened_date', filters.startDate)
      }
      if (filters?.endDate) {
        industryQuery = industryQuery.lte('opened_date', filters.endDate)
      }

      const { data: industryData, error: industryError } = await industryQuery

      if (industryError) {
        console.error('Industry query error:', industryError)
        throw industryError
      }

      // Count industries
      const industryCounts = new Map<string, number>()
      industryData?.forEach(d => {
        if (d.industry) {
          industryCounts.set(d.industry, (industryCounts.get(d.industry) || 0) + 1)
        }
      })

      // Get docket type data (we need all dockets for this since we can't filter by type in the industry query)
      const { data: allDockets, error: allDocketsError } = await supabase
        .from('dockets')
        .select('docket_type')
        .in('uuid', uuids)
        .not('docket_type', 'is', null)
        .neq('docket_type', '')

      if (allDocketsError) {
        console.error('Docket type query error:', allDocketsError)
        throw allDocketsError
      }

      // Count docket types
      const typeCounts = new Map<string, number>()
      allDockets?.forEach(d => {
        if (d.docket_type) {
          typeCounts.set(d.docket_type, (typeCounts.get(d.docket_type) || 0) + 1)
        }
      })

      return new Response(
        JSON.stringify({
          dateBounds: {
            min: minData?.[0]?.opened_date || null,
            max: maxData?.[0]?.opened_date || null
          },
          industries: Array.from(industryCounts.entries()).map(([industry, count]) => ({ industry, count })),
          docketTypes: Array.from(typeCounts.entries()).map(([docket_type, count]) => ({ docket_type, count }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For full docket data, build the query step by step
    let query = supabase
      .from('dockets')
      .select(`
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
      `)

    // Join with docket_petitioned_by_org using a subquery approach
    const { data: docketUuids, error: docketUuidsError } = await supabase
      .from('docket_petitioned_by_org')
      .select('docket_uuid')
      .eq('petitioner_uuid', orgId)

    if (docketUuidsError) {
      console.error('Error getting docket UUIDs:', docketUuidsError)
      throw docketUuidsError
    }

    const uuids = docketUuids.map(d => d.docket_uuid)
    if (uuids.length === 0) {
      return new Response(
        JSON.stringify([]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Apply filters
    query = query.in('uuid', uuids)

    if (filters?.startDate) {
      query = query.gte('opened_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('opened_date', filters.endDate)
    }
    if (filters?.industries && filters.industries.length > 0) {
      query = query.in('industry', filters.industries)
    }

    // Apply sorting
    if (filters?.sortBy === 'opened_date') {
      query = query.order('opened_date', { ascending: filters.sortOrder === 'asc' })
    } else {
      // Default sort by opened_date desc
      query = query.order('opened_date', { ascending: false })
    }

    const { data: dockets, error: docketsError } = await query

    if (docketsError) {
      console.error('Error getting dockets:', docketsError)
      throw docketsError
    }

    console.log(`Found ${dockets.length} dockets for org ${orgName}`)

    return new Response(
      JSON.stringify(dockets),
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