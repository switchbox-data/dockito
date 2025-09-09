import { useState, useEffect } from "react";
import { Search, TrendingUp, Zap, Building, FileText, Calendar, User, MapPin } from "lucide-react";

type Docket = {
  uuid: string;
  docket_govid: string;
  docket_title: string | null;
  docket_description: string | null;
  industry: string | null;
  docket_type: string | null;
  petitioner_strings: string[] | null;
  opened_date: string;
  docket_subtype: string | null;
  current_status: string | null;
  petitioner?: string;
};
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import KeyboardShortcut from "@/components/KeyboardShortcut";

const Home = () => {
  const navigate = useNavigate();

  // Function to open Command K menu
  const openCommandK = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      code: 'KeyK',
      ctrlKey: true,
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };


  // Real dockets with many filings organized by category
  const curatedSections = [
    {
      title: "Recent Rate Cases",
      description: "Latest utility rate adjustment proceedings",
      icon: TrendingUp,
      dockets: [
        {
          uuid: "1",
          docket_govid: "22-E-0319",
          docket_title: "Proceeding on Motion of the Commission as to the Rates, Charges, Rules and Regulations of Rochester Gas and Electric Corporation for Electric Service.",
          docket_description: null,
          industry: "Electric",
          docket_type: "Tariff",
          petitioner_strings: ["Rochester Gas and Electric"],
          opened_date: "2022-05-26",
          docket_subtype: null,
          current_status: "",
          petitioner: "Rochester Gas and Electric"
        },
        {
          uuid: "2", 
          docket_govid: "21-E-0545",
          docket_title: "Proceeding on Motion of the Commission as to the Rates, Charges, Rules and Regulations of Orange and Rockland Utilities, Inc. for Electric Service.",
          docket_description: null,
          industry: "Electric",
          docket_type: "Tariff", 
          petitioner_strings: ["Orange and Rockland Utilities"],
          opened_date: "2021-11-18",
          docket_subtype: null,
          current_status: "",
          petitioner: "Orange and Rockland Utilities"
        },
        {
          uuid: "3",
          docket_govid: "19-E-0239",
          docket_title: "Proceeding on Motion of the Commission as to the Rates, Charges, Rules and Regulations of Central Hudson Gas & Electric Corporation for Electric Service.",
          docket_description: null,
          industry: "Electric",
          docket_type: "Tariff",
          petitioner_strings: ["Central Hudson Gas & Electric"],
          opened_date: "2019-05-16", 
          docket_subtype: null,
          current_status: "",
          petitioner: "Central Hudson Gas & Electric"
        },
        {
          uuid: "4",
          docket_govid: "18-E-0067",
          docket_title: "Proceeding on Motion of the Commission as to the Rates, Charges, Rules and Regulations of Consolidated Edison Company of New York, Inc. for Electric Service.",
          docket_description: null,
          industry: "Electric",
          docket_type: "Tariff",
          petitioner_strings: ["Consolidated Edison Company of New York"],
          opened_date: "2018-01-25",
          docket_subtype: null,
          current_status: "",
          petitioner: "Consolidated Edison Company of New York"
        }
      ],
    },
    {
      title: "Major Energy Projects",
      description: "Large-scale renewable energy facility applications",
      icon: Zap,
      dockets: [
        {
          uuid: "5",
          docket_govid: "98-F-1885",
          docket_title: "Application of Sithe Energies, Inc. for a Certificate of Environmental Compatability and Public Need to Construct and Operate an 827 megawatt natural gas fired combined cycle combustion turbine generating facility (the Torne Valley Station)in the Town of Ramapo, Rockland County.",
          docket_description: null,
          industry: "Facility Gen.",
          docket_type: "Petition",
          petitioner_strings: ["Sithe Energies"],
          opened_date: "1998-12-01",
          docket_subtype: null,
          current_status: "",
          petitioner: "Sithe Energies"
        },
        {
          uuid: "6",
          docket_govid: "14-F-0485",
          docket_title: "Application of Lighthouse Wind LLC for a Certificate of Environmental Compatibility and Public Need Pursuant to Article 10 to Construct a 201 MW Wind Energy Facility.",
          docket_description: null,
          industry: "Facility Gen.",
          docket_type: "Petition",
          petitioner_strings: ["Lighthouse Wind"],
          opened_date: "2014-10-31",
          docket_subtype: null,
          current_status: "",
          petitioner: "Lighthouse Wind"
        },
        {
          uuid: "7",
          docket_govid: "15-F-0327", 
          docket_title: "Application of Galloo Island Wind LLC for a Certificate of Environmental Compatibility and Public Need Pursuant to Article 10 to Construct a Wind Energy Project.",
          docket_description: null,
          industry: "Facility Gen.",
          docket_type: "Petition",
          petitioner_strings: ["Galloo Island Wind"],
          opened_date: "2015-06-16",
          docket_subtype: null,
          current_status: "",
          petitioner: "Galloo Island Wind"
        },
        {
          uuid: "8",
          docket_govid: "17-F-0282",
          docket_title: "Application of Excelsior Wind LLC for a Certificate of Environmental Compatibility and Public Need Pursuant to Article 10 to Construct a Wind Energy Project.",
          docket_description: null,
          industry: "Facility Gen.",
          docket_type: "Petition", 
          petitioner_strings: ["Excelsior Wind"],
          opened_date: "2017-05-15",
          docket_subtype: null,
          current_status: "",
          petitioner: "Excelsior Wind"
        }
      ],
    },
    {
      title: "Telecommunications & Policy",
      description: "Communications industry regulations and policies",
      icon: Building,
      dockets: [
        {
          uuid: "9",
          docket_govid: "14-00702",
          docket_title: "In the Matter of Detariffing Non-Basic Retail Telecommunication Services filed Pursuant to Section 92-g of the Public Service Law.",
          docket_description: null,
          industry: "Communication",
          docket_type: "Tariff",
          petitioner_strings: ["All Communications Companies"],
          opened_date: "2014-03-31",
          docket_subtype: null,
          current_status: "",
          petitioner: "All Communications Companies"
        },
        {
          uuid: "10",
          docket_govid: "09-M-0311",
          docket_title: "Implementation of Chapter 59 of the Laws of 2009 Establishing a Temporary Annual Assessment Pursuant to Public Service Law Section 18-a.",
          docket_description: null,
          industry: "Miscellaneous",
          docket_type: "Rulemaking",
          petitioner_strings: ["New York State Department of Public Service"],
          opened_date: "2009-07-15",
          docket_subtype: null,
          current_status: "",
          petitioner: "New York State Department of Public Service"
        },
        {
          uuid: "11",
          docket_govid: "16-00131",
          docket_title: "In the Matter of Statements of Intrastate Gross Operating Revenues for 2015.",
          docket_description: null,
          industry: "Miscellaneous",
          docket_type: "Petition",
          petitioner_strings: ["New York State Department of Public Service"],
          opened_date: "2016-01-21",
          docket_subtype: null,
          current_status: "",
          petitioner: "New York State Department of Public Service"
        },
        {
          uuid: "12",
          docket_govid: "12-00071",
          docket_title: "In the Matter of Statements of Intrastate Gross Operating Revenues.",
          docket_description: null,
          industry: "Miscellaneous",
          docket_type: "Petition",
          petitioner_strings: ["New York State Department of Public Service"],
          opened_date: "2012-01-12",
          docket_subtype: null,
          current_status: "",
          petitioner: "New York State Department of Public Service"
        }
      ],
    },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Cohesive Logo Header */}
        <div className="text-center space-y-12 pt-8">
          <div className="flex items-center justify-center gap-8">
            {/* Dockito Logo */}
            <div className="flex items-center gap-5">
              <div className="bg-primary rounded-2xl p-4">
                <FileText className="h-12 w-12 text-primary-foreground" />
              </div>
              <span className="text-5xl font-bold text-foreground">dockito</span>
            </div>
            
            {/* Separator */}
            <div className="w-px h-16 bg-border"></div>
            
            {/* New York PSC Branding */}
            <div className="flex items-center gap-5">
              <div className="bg-muted rounded-2xl p-4">
                <MapPin className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-foreground">New York</div>
                <div className="text-xl text-muted-foreground">Public Service Commission</div>
              </div>
            </div>
          </div>
          
          <p className="text-2xl text-muted-foreground max-w-3xl mx-auto">
            Search and explore public utility commission dockets & documents
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div 
            className="relative cursor-pointer flex h-12 w-full rounded-md border border-gray-300 bg-white/95 px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={openCommandK}
          >
            <Search className="mr-3 h-5 w-5 shrink-0 opacity-50" />
            <span className="text-base text-muted-foreground flex-1">
              Type a docket number, title, or organization...
            </span>
            <KeyboardShortcut keys={["mod", "k"]} className="ml-auto" />
          </div>
        </div>

        {/* Curated Docket Sections */}
        <div className="space-y-8">
          {curatedSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div key={section.title} className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center gap-3 border-b pb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                
                {/* Dockets Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {section.dockets.map((docket) => (
                    <Link
                      key={docket.docket_govid}
                      to={`/docket/${docket.docket_govid}`}
                      aria-label={`Open docket ${docket.docket_govid}`}
                      className="group block focus-visible:outline-none"
                    >
                      <Card className="transition-colors hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background group bg-white/95">
                        <CardContent className="p-4 space-y-1">
                          <div className="flex items-start justify-between gap-3 mb-1 pb-2">
                            <div className="flex flex-wrap gap-1">
                              {docket.docket_type && (
                                <Badge variant="outline" className="inline-flex items-center gap-1.5 transition-colors border-gray-300 bg-background group-hover:border-primary/30">
                                  <FileText size={12} className="text-muted-foreground" />
                                  {docket.docket_type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {docket.industry && (
                                <Badge variant="outline" className="inline-flex items-center gap-1.5 border-gray-300 bg-background group-hover:border-primary/30 transition-colors">
                                  <Building size={12} className="text-muted-foreground" />
                                  {docket.industry}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="border-t border-border/50 pt-3">
                            <div className="space-y-2 pb-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-foreground font-semibold">{docket.docket_govid}</div>
                                <span className="text-xs text-muted-foreground">Opened: {formatDate(docket.opened_date)}</span>
                              </div>
                              <h3 className="text-sm font-normal leading-snug text-foreground">{docket.docket_title ?? "Untitled docket"}</h3>
                            </div>
                          </div>
                          
                          <div className="border-t border-border/50 pt-3">
                            <div className="flex flex-wrap gap-2">
                              {docket.petitioner_strings?.slice(0, 2).map(p => (
                                <Badge
                                  key={p}
                                  variant="outline"
                                  className="text-xs bg-background border-gray-300 hover:border-gray-400 transition-colors"
                                >
                                  {p}
                                </Badge>
                              ))}
                              {docket.petitioner_strings && docket.petitioner_strings.length > 2 && (
                                <Badge variant="secondary" className="text-xs">+{docket.petitioner_strings.length - 2} more</Badge>
                              )}
                              {docket.current_status && <Badge variant="secondary">{docket.current_status}</Badge>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                
                {/* Show more link */}
                <div className="text-center pt-2">
                  <Link 
                    to="/dockets" 
                    className="text-sm text-primary hover:underline story-link"
                  >
                    View all {section.title.toLowerCase()} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;