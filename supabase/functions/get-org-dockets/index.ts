import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

interface GetOrgDocketsRequest {
  orgName: string
  filters?: {
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    industries?: string[]
    docketTypes?: string[]
    relationshipTypes?: string[] // 'petitioned', 'filed', or both
  }
  aggregateOnly?: boolean
  pagination?: {
    page: number
    limit: number
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Helper function to get docket UUIDs and filing counts
    const getDocketUuids = async () => {
      const relationshipTypes = filters?.relationshipTypes || ['petitioned', 'filed']
      let allDocketUuids = new Set<string>()
      let petitionedDocketCount = 0
      let totalFilingCount = 0
      
      // Get petitioned dockets if requested
      if (relationshipTypes.includes('petitioned')) {
        let from = 0
        const batchSize = 1000
        
        while (true) {
          const { data: batchRelations, error: batchError } = await supabase
            .from('docket_petitioned_by_org')
            .select('docket_uuid')
            .eq('petitioner_uuid', orgId)
            .range(from, from + batchSize - 1)
          
          if (batchError) {
            console.error('Error getting petitioned docket relations batch:', batchError)
            break
          }
          
          if (!batchRelations || batchRelations.length === 0) {
            break
          }
          
          batchRelations.forEach(r => {
            if (!allDocketUuids.has(r.docket_uuid)) {
              allDocketUuids.add(r.docket_uuid)
              petitionedDocketCount++
            }
          })
          
          if (batchRelations.length < batchSize) {
            break
          }
          
          from += batchSize
        }
      }
      
      // Get filed dockets if requested (count filings, not dockets)
      if (relationshipTypes.includes('filed')) {
        // Get filings by this organization
        let from = 0
        const batchSize = 1000
        const fillingUuidsSet = new Set<string>()
        
        while (true) {
          const { data: batchRelations, error: batchError } = await supabase
            .from('fillings_on_behalf_of_org_relation')
            .select('filling_uuid')
            .eq('author_organization_uuid', orgId)
            .range(from, from + batchSize - 1)
          
          if (batchError) {
            console.error('Error getting filing relations batch:', batchError)
            break
          }
          
          if (!batchRelations || batchRelations.length === 0) {
            break
          }
          
          // Collect unique filling UUIDs
          batchRelations.forEach(r => fillingUuidsSet.add(r.filling_uuid))
          
          if (batchRelations.length < batchSize) {
            break
          }
          
          from += batchSize
        }

        // Set total filing count as number of unique filings
        totalFilingCount = fillingUuidsSet.size

        // Resolve dockets for these filings in chunks
        const fillingUuids = Array.from(fillingUuidsSet)
        const chunkSize = 50
        
        for (let i = 0; i < fillingUuids.length; i += chunkSize) {
          const chunk = fillingUuids.slice(i, i + chunkSize)
          const { data: fillings, error: fillingsError } = await supabase
            .from('fillings')
            .select('docket_uuid')
            .in('uuid', chunk)
          
          if (!fillingsError && fillings) {
            fillings.forEach(f => {
              allDocketUuids.add(f.docket_uuid)
            })
          }
        }
      }
      
      return { 
        docketUuids: Array.from(allDocketUuids), 
        petitionedDocketCount, 
        totalFilingCount 
      }
    }

    if (aggregateOnly) {
      console.log('Getting aggregate data for org:', orgName)
      
      const relationshipTypes = filters?.relationshipTypes || ['petitioned', 'filed']
      const { docketUuids, petitionedDocketCount, totalFilingCount } = await getDocketUuids()
      console.log(`Found ${docketUuids.length} docket UUIDs for org ${orgName}`)
      console.log(`Petitioned: ${petitionedDocketCount}, Filed: ${totalFilingCount}`)

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
          totalCount: docketUuids.length,
          petitionedCount: relationshipTypes.includes('petitioned') ? petitionedDocketCount : 0,
          filedCount: relationshipTypes.includes('filed') ? totalFilingCount : 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Main docket query
    const { docketUuids } = await getDocketUuids()
    console.log(`Found ${docketUuids.length} docket UUIDs for org ${orgName}`)

    if (docketUuids.length === 0) {
      return new Response(
        JSON.stringify({ dockets: [], totalCount: 0 }),
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