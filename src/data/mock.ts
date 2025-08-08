export type Docket = {
  docket_govid: string;
  docket_title: string;
  docket_description?: string | null;
  industry?: string | null;
  petitioner?: string | null;
  hearing_officer?: string | null;
  assigned_judge?: string | null;
  opened_date: string; // ISO date
  closed_date?: string | null;
  current_status?: string | null;
};

export type Filling = {
  uuid: string;
  docket_govid: string; // FK to dockets.docket_govid
  filed_date: string; // ISO date
  updated_at: string; // ISO date
  created_at: string; // ISO date
  filling_type?: string | null;
  filling_name?: string | null;
  filling_description?: string | null;
  organization_author_strings: string[]; // From DB schema
};

export type Attachment = {
  uuid: string;
  parent_filling_uuid: string; // FK to fillings.uuid
  attachment_file_extension: string; // e.g., 'pdf', 'xlsx', 'zip'
  attachment_file_name: string;
  attachment_title: string;
  attachment_type?: string | null;
  attachment_subtype?: string | null;
  attachment_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const MOCK_DOCKETS: Docket[] = [
  {
    docket_govid: "NY-24-00123",
    docket_title: "Consolidated Edison – Electric Rate Case",
    docket_description:
      "Proposed modifications to electric service rates and infrastructure investments.",
    industry: "electric",
    petitioner: "Consolidated Edison Company of New York, Inc.",
    hearing_officer: "Alex Johnson",
    assigned_judge: "Hon. R. Morales",
    opened_date: "2024-03-15",
    closed_date: null,
    current_status: "Active",
  },
  {
    docket_govid: "NY-24-00456",
    docket_title: "National Grid – Gas Supply Portfolio Update",
    docket_description: null,
    industry: "gas",
    petitioner: "KeySpan Gas East Corporation d/b/a National Grid",
    hearing_officer: null,
    assigned_judge: null,
    opened_date: "2024-05-02",
    closed_date: null,
    current_status: null,
  },
];

export const MOCK_FILLINGS: Filling[] = [
  {
    uuid: "f-1",
    docket_govid: "NY-24-00123",
    filed_date: "2024-03-20",
    created_at: "2024-03-20T10:00:00Z",
    updated_at: "2024-03-20T10:00:00Z",
    filling_type: "report",
    filling_name: "Initial Rate Case Filing",
    filling_description: null,
    organization_author_strings: [
      "Consolidated Edison Company of New York, Inc.",
    ],
  },
  {
    uuid: "f-2",
    docket_govid: "NY-24-00123",
    filed_date: "2024-04-10",
    created_at: "2024-04-10T12:30:00Z",
    updated_at: "2024-04-10T12:30:00Z",
    filling_type: "order",
    filling_name: "Staff Questions Set #1",
    filling_description: "Information request to petitioner.",
    organization_author_strings: ["NY DPS Staff"],
  },
  {
    uuid: "f-3",
    docket_govid: "NY-24-00456",
    filed_date: "2024-05-05",
    created_at: "2024-05-05T09:00:00Z",
    updated_at: "2024-05-05T09:00:00Z",
    filling_type: "report",
    filling_name: "Gas Portfolio Quarterly Update",
    filling_description: null,
    organization_author_strings: ["National Grid"],
  },
];

export const MOCK_ATTACHMENTS: Attachment[] = [
  {
    uuid: "a-1",
    parent_filling_uuid: "f-1",
    attachment_file_extension: "pdf",
    attachment_file_name: "coned-rate-case-overview.pdf",
    attachment_title: "Overview & Executive Summary",
    attachment_type: "report",
    attachment_subtype: null,
    attachment_url: "/pdfs/dummy.pdf",
  },
  {
    uuid: "a-2",
    parent_filling_uuid: "f-1",
    attachment_file_extension: "pdf",
    attachment_file_name: "coned-appendix-a.pdf",
    attachment_title: "Appendix A – Detailed Schedules",
    attachment_type: "appendix",
    attachment_subtype: null,
    attachment_url: "/pdfs/sample.pdf",
  },
  {
    uuid: "a-3",
    parent_filling_uuid: "f-2",
    attachment_file_extension: "xlsx",
    attachment_file_name: "questions-set-1.xlsx",
    attachment_title: "Questions – Data Request Template",
    attachment_type: "template",
    attachment_subtype: null,
    attachment_url: "/pdfs/sample.xlsx",
  },
  {
    uuid: "a-4",
    parent_filling_uuid: "f-3",
    attachment_file_extension: "zip",
    attachment_file_name: "ng-gas-portfolio-data.zip",
    attachment_title: "Portfolio Raw Data (ZIP)",
    attachment_type: "data",
    attachment_subtype: null,
    attachment_url: "/pdfs/sample.zip",
  },
];
