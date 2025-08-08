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

// Base seed data (kept for stability in examples)
const BASE_FILLINGS: Filling[] = [
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

const BASE_ATTACHMENTS: Attachment[] = [
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

// Expand mock data: hundreds of filings and many orgs/types
const ORGS = [
  "Consolidated Edison Company of New York, Inc.",
  "NY DPS Staff",
  "National Grid",
  "Avangrid",
  "Orange & Rockland",
  "Central Hudson",
  "PSEG Long Island",
  "New York Power Authority",
  "Joint Utilities of NY",
  "Acme Energy Solutions",
  "Clean Energy Coalition",
  "Consumers Union",
  "Environmental Defense Fund",
  "Sierra Club",
  "Sunrise Renewables",
  "WindCo Northeast",
  "Hydro Partners",
  "Microgrid NYC",
  "Grid Modernization Alliance",
  "EV Infrastructure Group",
  "City of New York",
  "NYS Attorney General",
  "Independent Power Producers",
  "Upstate Solar",
  "Downstate Storage, LLC",
  "Ratepayer Advocates",
  "Community Energy Hub",
  "Heat Pump Association",
  "Thermal Networks Inc.",
  "WaterCo NY",
  "Gas Reliability Council",
  "Energy Storage Assoc.",
  "Public Advocate",
  "Utility Workers Union",
  "Local 123",
  "Green Buildings Council",
  "Smart Thermostat Makers",
  "Research Triangle Group",
  "Rural Electric Coop",
  "Transmission Partners",
  "Distributed Energy NY",
];

const TYPES = [
  "order",
  "report",
  "notice",
  "petition",
  "motion",
  "comment",
  "reply",
  "letter",
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[randomInt(0, arr.length - 1)];
}

// Generate filings across both example dockets
const GENERATED_FILLINGS: Filling[] = [];
const GENERATED_ATTACHMENTS: Attachment[] = [];

let fCounter = 1000;
let aCounter = 5000;

const docketsToPopulate = ["NY-24-00123", "NY-24-00456"];

for (const docketId of docketsToPopulate) {
  const count = docketId === "NY-24-00123" ? 220 : 180; // hundreds total
  for (let i = 0; i < count; i++) {
    const uuid = `f-${fCounter++}`;
    const type = pick(TYPES);
    const filed = new Date(2024, randomInt(0, 6), randomInt(1, 28));
    const orgCount = Math.random() < 0.2 ? 2 : 1;
    const orgs = Array.from({ length: orgCount }, () => pick(ORGS));
    const uniqueOrgs = Array.from(new Set(orgs));

    GENERATED_FILLINGS.push({
      uuid,
      docket_govid: docketId,
      filed_date: filed.toISOString().slice(0, 10),
      created_at: filed.toISOString(),
      updated_at: filed.toISOString(),
      filling_type: type,
      filling_name: `${type[0].toUpperCase()}${type.slice(1)} – Submission ${i + 1}`,
      filling_description: Math.random() < 0.55 ? `Detailed ${type} related to ${docketId} covering scope ${i + 1}.` : null,
      organization_author_strings: uniqueOrgs,
    });

    // 1–3 attachments with at least one PDF
    const pdfCount = 1;
    const extraCount = Math.random() < 0.4 ? 1 : 0; // sometimes two files total
    const total = pdfCount + extraCount;

    for (let k = 0; k < total; k++) {
      const isPdf = k === 0 || Math.random() < 0.7;
      GENERATED_ATTACHMENTS.push({
        uuid: `a-${aCounter++}`,
        parent_filling_uuid: uuid,
        attachment_file_extension: isPdf ? "pdf" : pick(["xlsx", "zip"]),
        attachment_file_name: isPdf ? `attachment-${uuid}-${k + 1}.pdf` : `attachment-${uuid}-${k + 1}.dat`,
        attachment_title: isPdf ? `Document ${k + 1}` : `Supporting File ${k + 1}`,
        attachment_type: isPdf ? "document" : "data",
        attachment_subtype: null,
        attachment_url: isPdf ? "/pdfs/sample.pdf" : "/pdfs/sample.zip",
      });
    }
  }
}

export const MOCK_FILLINGS: Filling[] = [...BASE_FILLINGS, ...GENERATED_FILLINGS];
export const MOCK_ATTACHMENTS: Attachment[] = [
  ...BASE_ATTACHMENTS,
  ...GENERATED_ATTACHMENTS,
];
