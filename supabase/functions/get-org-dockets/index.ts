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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
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
      console.log('Getting aggregate data for org:', orgName)
      
      // Get all docket UUIDs for this organization first
      let allDocketRelations: any[] = []
      let from = 0
      const batchSize = 1000
      
      // Fetch all relations in batches to avoid limits
      while (true) {
        const { data: batchRelations, error: batchError } = await supabase
          .from('docket_petitioned_by_org')
          .select('docket_uuid')
          .eq('petitioner_uuid', orgId)
          .range(from, from + batchSize - 1)
        
        if (batchError) {
          console.error('Error getting docket relations batch:', batchError)
          break
        }
        
        if (!batchRelations || batchRelations.length === 0) {
          break
        }
        
        allDocketRelations = allDocketRelations.concat(batchRelations)
        
        if (batchRelations.length < batchSize) {
          break // Last batch
        }
        
        from += batchSize
      }
      
      const docketRelations = allDocketRelations

      if (allDocketRelations.length === 0) {
        console.log('No docket relations found for org:', orgName)
      }

      const docketUuids = docketRelations?.map(rel => rel.docket_uuid) || []
      console.log(`Found ${docketUuids.length} docket UUIDs for org ${orgName}`)
      console.log(`Total count being returned: ${docketUuids.length}`)

      if (docketUuids.length === 0) {
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

      // Function to chunk array into smaller pieces
      const chunkArray = (array: any[], size: number) => {
        const chunks = []
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size))
        }
        return chunks
      }

      // Chunk the UUIDs to avoid URL length issues
      const chunks = chunkArray(docketUuids, 50)
      
      let allDockets: any[] = []
      
      // Fetch dockets in chunks
      for (const chunk of chunks) {
        let chunkQuery = supabase
          .from('dockets')
          .select('opened_date, industry, docket_type')
          .in('uuid', chunk)

        // Apply date filters
        if (filters?.startDate) {
          chunkQuery = chunkQuery.gte('opened_date', filters.startDate)
        }
        if (filters?.endDate) {
          chunkQuery = chunkQuery.lte('opened_date', filters.endDate)
        }

        const { data: chunkDockets, error: chunkError } = await chunkQuery

        if (chunkError) {
          console.error('Error getting chunk dockets:', chunkError)
          continue
        }

        if (chunkDockets) {
          allDockets = allDockets.concat(chunkDockets)
        }
      }

      console.log(`Found ${allDockets.length} dockets for aggregation for org ${orgName}`)

      // Calculate aggregates efficiently
      const dates = allDockets
        .map(d => d.opened_date)
        .filter(date => date)
        .sort()

      const dateBounds = dates.length > 0 ? {
        min: dates[0],
        max: dates[dates.length - 1]
      } : { min: null, max: null }

      const industryMap = new Map<string, number>()
      const typeMap = new Map<string, number>()

      allDockets.forEach(d => {
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
          totalCount: docketUuids.length // Use the original count of all dockets, not filtered ones
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Main docket query - go back to chunking approach for now
    const { data: docketRelations, error: relationsError } = await supabase
      .from('docket_petitioned_by_org')
      .select('docket_uuid')
      .eq('petitioner_uuid', orgId)
      .limit(10000) // Set a high limit to get all results

    if (relationsError) {
      console.error('Error getting docket relations:', relationsError)
      return new Response(
        JSON.stringify({ error: 'Failed to get docket relations', details: relationsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const docketUuids = docketRelations?.map(rel => rel.docket_uuid) || []
    console.log(`Found ${docketUuids.length} docket UUIDs for org ${orgName}`)

    if (docketUuids.length === 0) {
      return new Response(
        JSON.stringify({ dockets: [], pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Function to chunk array into smaller pieces
    const chunkArray = (array: any[], size: number) => {
      const chunks = []
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
      }
      return chunks
    }

    // Chunk the UUIDs to avoid URL length issues
    const chunks = chunkArray(docketUuids, 50)
    
    let allDockets: any[] = []
    
    // Fetch dockets in chunks
    for (const chunk of chunks) {
      let chunkQuery = supabase
        .from('dockets')
        .select('uuid, docket_govid, docket_title, docket_description, opened_date, closed_date, current_status, industry, docket_type, docket_subtype, assigned_judge, hearing_officer, petitioner_strings')
        .in('uuid', chunk)

      // Apply filters
      if (filters?.startDate) {
        chunkQuery = chunkQuery.gte('opened_date', filters.startDate)
      }
      if (filters?.endDate) {
        chunkQuery = chunkQuery.lte('opened_date', filters.endDate)
      }
      if (filters?.industries && filters.industries.length > 0) {
        chunkQuery = chunkQuery.in('industry', filters.industries)
      }
      if (filters?.docketTypes && filters.docketTypes.length > 0) {
        chunkQuery = chunkQuery.in('docket_type', filters.docketTypes)
      }

      const { data: chunkDockets, error: chunkError } = await chunkQuery

      if (chunkError) {
        console.error('Error getting chunk dockets:', chunkError)
        continue
      }

      if (chunkDockets) {
        allDockets = allDockets.concat(chunkDockets)
      }
    }

    console.log(`Found ${allDockets.length} dockets for org ${orgName}`)

    // Sort the results
    const sortBy = filters?.sortBy || 'opened_date'
    const sortOrder = filters?.sortOrder || 'desc'

    allDockets.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]

      if (sortBy === 'opened_date') {
        aVal = new Date(aVal || '').getTime()
        bVal = new Date(bVal || '').getTime()
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    // Apply pagination
    const page = pagination?.page || 1
    const limit = pagination?.limit || 50
    const offset = (page - 1) * limit
    const paginatedDockets = allDockets.slice(offset, offset + limit)

    const response = {
      dockets: paginatedDockets,
      pagination: {
        page,
        limit,
        totalCount: allDockets.length,
        totalPages: Math.ceil(allDockets.length / limit),
        hasNextPage: offset + limit < allDockets.length,
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