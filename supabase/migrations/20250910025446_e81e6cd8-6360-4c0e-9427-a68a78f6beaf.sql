-- Recreate function with secure search_path set
CREATE OR REPLACE FUNCTION get_dockets_with_filing_counts(
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 50,
  p_sort_by TEXT DEFAULT 'date',
  p_sort_order TEXT DEFAULT 'desc',
  p_search TEXT DEFAULT NULL,
  p_industries TEXT[] DEFAULT NULL,
  p_docket_types TEXT[] DEFAULT NULL,
  p_docket_subtypes TEXT[] DEFAULT NULL,
  p_petitioners TEXT[] DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  uuid UUID,
  docket_govid TEXT,
  docket_title TEXT,
  docket_description TEXT,
  docket_type TEXT,
  docket_subtype TEXT,
  industry TEXT,
  petitioner_strings TEXT[],
  opened_date DATE,
  closed_date DATE,
  current_status TEXT,
  assigned_judge TEXT,
  hearing_officer TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  filing_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.uuid,
    d.docket_govid,
    d.docket_title,
    d.docket_description,
    d.docket_type,
    d.docket_subtype,
    d.industry,
    d.petitioner_strings,
    d.opened_date,
    d.closed_date,
    d.current_status,
    d.assigned_judge,
    d.hearing_officer,
    d.created_at,
    d.updated_at,
    COALESCE(fc.filing_count, 0) as filing_count
  FROM dockets d
  LEFT JOIN (
    SELECT 
      docket_uuid,
      COUNT(*) as filing_count
    FROM fillings
    GROUP BY docket_uuid
  ) fc ON d.uuid = fc.docket_uuid
  WHERE 
    (p_search IS NULL OR (
      d.docket_govid ILIKE '%' || p_search || '%' OR 
      d.docket_title ILIKE '%' || p_search || '%' OR 
      d.docket_description ILIKE '%' || p_search || '%'
    ))
    AND (p_industries IS NULL OR d.industry = ANY(p_industries))
    AND (p_docket_types IS NULL OR d.docket_type = ANY(p_docket_types))
    AND (p_docket_subtypes IS NULL OR d.docket_subtype = ANY(p_docket_subtypes))
    AND (p_start_date IS NULL OR d.opened_date >= p_start_date)
    AND (p_end_date IS NULL OR d.opened_date <= p_end_date)
    AND (p_petitioners IS NULL OR (
      EXISTS (
        SELECT 1 FROM unnest(d.petitioner_strings) as pet
        WHERE pet = ANY(p_petitioners)
      )
    ))
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'filing_count' AND p_sort_order = 'desc' THEN fc.filing_count
    END DESC,
    CASE 
      WHEN p_sort_by = 'filing_count' AND p_sort_order = 'asc' THEN fc.filing_count
    END ASC,
    CASE 
      WHEN p_sort_by = 'date' AND p_sort_order = 'desc' THEN d.opened_date
    END DESC,
    CASE 
      WHEN p_sort_by = 'date' AND p_sort_order = 'asc' THEN d.opened_date
    END ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;