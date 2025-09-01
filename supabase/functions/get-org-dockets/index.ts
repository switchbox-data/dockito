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
      // For aggregates, we'll chunk the UUIDs to avoid URL length issues
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
            industries: [],
            docketTypes: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Found ${uuids.length} docket UUIDs for org ${orgName}`)

      // Function to chunk and process UUIDs to avoid URL length limits
      const CHUNK_SIZE = 50 // Safe chunk size to avoid URL limits
      const chunkArray = (array: string[], size: number) => {
        const chunks = []
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size))
        }
        return chunks
      }

      const uuidChunks = chunkArray(uuids, CHUNK_SIZE)
      
      // Get date bounds from chunks
      let minDate: string | null = null
      let maxDate: string | null = null
      
      for (const chunk of uuidChunks) {
        const [{ data: minData }, { data: maxData }] = await Promise.all([
          supabase
            .from('dockets')
            .select('opened_date')
            .in('uuid', chunk)
            .order('opened_date', { ascending: true })
            .limit(1),
          supabase
            .from('dockets')
            .select('opened_date')
            .in('uuid', chunk)
            .order('opened_date', { ascending: false })
            .limit(1)
        ])
        
        if (minData?.[0]?.opened_date && (!minDate || minData[0].opened_date < minDate)) {
          minDate = minData[0].opened_date
        }
        if (maxData?.[0]?.opened_date && (!maxDate || maxData[0].opened_date > maxDate)) {
          maxDate = maxData[0].opened_date
        }
      }

      // Get industry and type data by chunks
      const industryMap = new Map<string, number>()
      const typeMap = new Map<string, number>()

      for (const chunk of uuidChunks) {
        let chunkQuery = supabase
          .from('dockets')
          .select('industry, docket_type')
          .in('uuid', chunk)

        if (filters?.startDate) {
          chunkQuery = chunkQuery.gte('opened_date', filters.startDate)
        }
        if (filters?.endDate) {
          chunkQuery = chunkQuery.lte('opened_date', filters.endDate)
        }

        const { data: chunkData, error: chunkError } = await chunkQuery

        if (chunkError) {
          console.error('Chunk query error:', chunkError)
          throw chunkError
        }

        chunkData?.forEach(d => {
          if (d.industry) {
            industryMap.set(d.industry, (industryMap.get(d.industry) || 0) + 1)
          }
          if (d.docket_type) {
            typeMap.set(d.docket_type, (typeMap.get(d.docket_type) || 0) + 1)
          }
        })
      }

      return new Response(
        JSON.stringify({
          dateBounds: {
            min: minDate,
            max: maxDate
          },
          industries: Array.from(industryMap.entries()).map(([industry, count]) => ({ industry, count })),
          docketTypes: Array.from(typeMap.entries()).map(([docket_type, count]) => ({ docket_type, count }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For full docket data, use chunking to avoid URL length limits
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

    console.log(`Found ${uuids.length} docket UUIDs for org ${orgName}`)

    // Chunk UUIDs to avoid URL length limits
    const CHUNK_SIZE = 50
    const chunkArray = (array: string[], size: number) => {
      const chunks = []
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
      }
      return chunks
    }

    const uuidChunks = chunkArray(uuids, CHUNK_SIZE)
    let allDockets: any[] = []

    // Process each chunk
    for (const chunk of uuidChunks) {
      let chunkQuery = supabase
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

      const { data: chunkDockets, error: chunkError } = await chunkQuery

      if (chunkError) {
        console.error('Error getting chunk dockets:', chunkError)
        throw chunkError
      }

      allDockets = allDockets.concat(chunkDockets || [])
    }

    // Apply sorting after combining all chunks
    if (filters?.sortBy === 'opened_date') {
      allDockets.sort((a, b) => {
        const dateA = new Date(a.opened_date).getTime()
        const dateB = new Date(b.opened_date).getTime()
        return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
    } else {
      // Default sort by opened_date desc
      allDockets.sort((a, b) => {
        const dateA = new Date(a.opened_date).getTime()
        const dateB = new Date(b.opened_date).getTime()
        return dateB - dateA
      })
    }

    console.log(`Found ${allDockets.length} dockets for org ${orgName}`)

    return new Response(
      JSON.stringify(allDockets),
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