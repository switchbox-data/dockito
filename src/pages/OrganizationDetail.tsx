import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getIndustryIcon, getIndustryColor } from "@/utils/industryIcons";
import { format } from "date-fns";
import { Link } from "react-router-dom";

type OrganizationData = {
  uuid: string;
  name: string;
  description: string | null;
  artifical_person_type: string | null;
  dockets: Array<{
    uuid: string;
    docket_govid: string;
    docket_title: string | null;
    industry: string | null;
    docket_type: string | null;
    opened_date: string;
    current_status: string | null;
  }>;
  filing_count: number;
};

const OrganizationPage = () => {
  const { orgName } = useParams<{ orgName: string }>();
  const decodedOrgName = orgName ? decodeURIComponent(orgName) : "";

  const { data: organization, isLoading, error } = useQuery({
    queryKey: ["organization", decodedOrgName],
    queryFn: async () => {
      if (!decodedOrgName) throw new Error("No organization name provided");

      // Get organization details
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("uuid, name, description, artifical_person_type")
        .eq("name", decodedOrgName)
        .single();

      if (orgError) throw orgError;
      if (!orgData) throw new Error("Organization not found");

      // Get dockets this organization has petitioned
      const { data: docketData, error: docketError } = await supabase
        .from("dockets")
        .select("uuid, docket_govid, docket_title, industry, docket_type, opened_date, current_status")
        .contains("petitioner_strings", [decodedOrgName])
        .order("opened_date", { ascending: false });

      if (docketError) throw docketError;

      // Get filing count for this organization
      const { count: filingCount, error: filingError } = await supabase
        .from("fillings")
        .select("*", { count: "exact", head: true })
        .contains("organization_author_strings", [decodedOrgName]);

      if (filingError) throw filingError;

      return {
        ...orgData,
        dockets: docketData || [],
        filing_count: filingCount || 0,
      } as OrganizationData;
    },
    enabled: !!decodedOrgName,
  });

  if (isLoading) {
    return (
      <main className="container py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !organization) {
    return (
      <main className="container py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-semibold mb-2">Organization Not Found</h1>
            <p className="text-muted-foreground">
              The organization "{decodedOrgName}" could not be found.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container py-6 space-y-6">
      {/* Organization Header */}
      <Card className="border-gray-300 bg-white/95 shadow-[var(--shadow-elegant)]">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">{organization.name}</CardTitle>
                {organization.artifical_person_type && (
                  <Badge variant="outline" className="mt-2">
                    {organization.artifical_person_type}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {organization.description && (
            <CardDescription className="text-base mt-4">
              {organization.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Dockets Petitioned</div>
                <div className="text-lg font-semibold">{organization.dockets.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Total Filings</div>
                <div className="text-lg font-semibold">{organization.filing_count}</div>
              </div>
            </div>
            {organization.dockets.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Latest Petition</div>
                  <div className="text-sm font-medium">
                    {format(new Date(organization.dockets[0].opened_date), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dockets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Dockets Petitioned</h2>
          {organization.dockets.length > 0 && (
            <Badge variant="secondary">{organization.dockets.length} total</Badge>
          )}
        </div>

        {organization.dockets.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No dockets found for this organization.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {organization.dockets.map((docket) => {
              const IndustryIcon = getIndustryIcon(docket.industry || "other");
              return (
                <Card key={docket.uuid} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/docket/${docket.docket_govid}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {docket.docket_govid}
                          </Link>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                        
                        {docket.docket_title && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {docket.docket_title}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(docket.opened_date), "MMM d, yyyy")}
                          </div>
                          {docket.current_status && (
                            <Badge variant="outline" className="text-xs">
                              {docket.current_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {docket.industry && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <IndustryIcon 
                              size={12} 
                              className={getIndustryColor(docket.industry)} 
                            />
                            {docket.industry}
                          </Badge>
                        )}
                        {docket.docket_type && (
                          <Badge variant="secondary" className="text-xs">
                            {docket.docket_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default OrganizationPage;