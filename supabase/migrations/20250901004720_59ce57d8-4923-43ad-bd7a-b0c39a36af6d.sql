-- Add indexes to improve query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_docket_petitioned_by_org_docket_uuid ON docket_petitioned_by_org(docket_uuid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_docket_petitioned_by_org_petitioner_uuid ON docket_petitioned_by_org(petitioner_uuid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dockets_opened_date ON dockets(opened_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dockets_industry ON dockets(industry);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dockets_docket_type ON dockets(docket_type);

-- Add foreign key constraints for better query optimization
ALTER TABLE docket_petitioned_by_org 
ADD CONSTRAINT fk_docket_petitioned_by_org_docket_uuid 
FOREIGN KEY (docket_uuid) REFERENCES dockets(uuid);

ALTER TABLE docket_petitioned_by_org 
ADD CONSTRAINT fk_docket_petitioned_by_org_petitioner_uuid 
FOREIGN KEY (petitioner_uuid) REFERENCES organizations(uuid);

-- Create a materialized view for org-docket relationships to improve performance
CREATE MATERIALIZED VIEW org_dockets AS
SELECT 
    o.uuid as org_uuid,
    o.name as org_name,
    d.uuid as docket_uuid,
    d.docket_govid,
    d.docket_title,
    d.docket_description,
    d.opened_date,
    d.closed_date,
    d.current_status,
    d.industry,
    d.docket_type,
    d.docket_subtype,
    d.assigned_judge,
    d.hearing_officer,
    d.petitioner_strings
FROM organizations o
JOIN docket_petitioned_by_org dpbo ON o.uuid = dpbo.petitioner_uuid
JOIN dockets d ON dpbo.docket_uuid = d.uuid;

-- Create indexes on the materialized view
CREATE INDEX idx_org_dockets_org_uuid ON org_dockets(org_uuid);
CREATE INDEX idx_org_dockets_opened_date ON org_dockets(opened_date);
CREATE INDEX idx_org_dockets_industry ON org_dockets(industry);
CREATE INDEX idx_org_dockets_docket_type ON org_dockets(docket_type);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_org_dockets()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW org_dockets;
END;
$$ LANGUAGE plpgsql;

-- Set up a trigger to refresh the view when relevant data changes
-- (Note: In production, you might want to refresh this periodically via a cron job instead)