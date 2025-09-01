-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_docket_petitioned_by_org_docket_uuid ON docket_petitioned_by_org(docket_uuid);
CREATE INDEX IF NOT EXISTS idx_docket_petitioned_by_org_petitioner_uuid ON docket_petitioned_by_org(petitioner_uuid);
CREATE INDEX IF NOT EXISTS idx_dockets_opened_date ON dockets(opened_date);
CREATE INDEX IF NOT EXISTS idx_dockets_industry ON dockets(industry);
CREATE INDEX IF NOT EXISTS idx_dockets_docket_type ON dockets(docket_type);

-- Add foreign key constraints for better query optimization
ALTER TABLE docket_petitioned_by_org 
ADD CONSTRAINT fk_docket_petitioned_by_org_docket_uuid 
FOREIGN KEY (docket_uuid) REFERENCES dockets(uuid);

ALTER TABLE docket_petitioned_by_org 
ADD CONSTRAINT fk_docket_petitioned_by_org_petitioner_uuid 
FOREIGN KEY (petitioner_uuid) REFERENCES organizations(uuid);