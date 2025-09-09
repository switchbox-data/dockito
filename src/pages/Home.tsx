import { useState, useEffect } from "react";
import { Search, TrendingUp, Zap, Building, FileText, Calendar, User, MapPin, Heart, DollarSign, Frown, Lock, FileCheck, Flame, Gavel, Book, EyeOff, FileSpreadsheet, Microscope, Clipboard, CheckCircle, MessageCircle, Lightbulb, HelpCircle } from "lucide-react";
import { getIndustryIcon, getIndustryColor } from "@/utils/industryIcons";

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

  // Helper function to get appropriate icon for docket types (copied from Dockets page)
  const getDocketTypeIcon = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'petition':
        return Heart;
      case 'tariff':
        return DollarSign;
      case 'complaint':
        return Frown;
      case 'contract':
        return Lock;
      case 'audit':
        return Search;
      case 'incident':
        return Flame;
      case 'compliance':
        return FileCheck;
      case 'commission instituted new case proceeding':
        return Gavel;
      case 'rulemaking':
        return Book;
      case 'exception from disclosure':
        return EyeOff;
      case 'company workpapers':
        return FileSpreadsheet;
      case 'analysis':
        return TrendingUp;
      case 'investigation':
        return Microscope;
      case 'office policy and procedures':
        return Clipboard;
      case 'authorization':
        return CheckCircle;
      case 'complaint and inquiry':
        return MessageCircle;
      case 'policy initiative':
        return Lightbulb;
      default:
        return HelpCircle;
    }
  };

  // Helper function to get semantic colors for docket types (copied from Dockets page)
  const getDocketTypeColor = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'petition':
        return 'text-blue-600';
      case 'tariff':
        return 'text-green-600';
      case 'complaint':
        return 'text-red-600';
      case 'contract':
        return 'text-purple-600';
      case 'audit':
        return 'text-orange-600';
      case 'incident':
        return 'text-red-500';
      case 'compliance':
        return 'text-emerald-600';
      case 'commission instituted new case proceeding':
        return 'text-indigo-600';
      case 'rulemaking':
        return 'text-slate-600';
      case 'exception from disclosure':
        return 'text-gray-600';
      case 'company workpapers':
        return 'text-amber-600';
      case 'analysis':
        return 'text-cyan-600';
      case 'investigation':
        return 'text-pink-600';
      case 'office policy and procedures':
        return 'text-teal-600';
      case 'authorization':
        return 'text-lime-600';
      case 'complaint and inquiry':
        return 'text-rose-600';
      case 'policy initiative':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  // Helper function to get subtle background and border colors for docket type badges (copied from Dockets page)
  const getDocketTypeBadgeColors = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'petition':
        return 'bg-blue-50 border-blue-200';
      case 'tariff':
        return 'bg-green-50 border-green-200';
      case 'complaint':
        return 'bg-red-50 border-red-200';
      case 'contract':
        return 'bg-purple-50 border-purple-200';
      case 'audit':
        return 'bg-orange-50 border-orange-200';
      case 'incident':
        return 'bg-red-50 border-red-300';
      case 'compliance':
        return 'bg-emerald-50 border-emerald-200';
      case 'commission instituted new case proceeding':
        return 'bg-indigo-50 border-indigo-200';
      case 'rulemaking':
        return 'bg-slate-50 border-slate-200';
      case 'exception from disclosure':
        return 'bg-gray-50 border-gray-200';
      case 'company workpapers':
        return 'bg-amber-50 border-amber-200';
      case 'analysis':
        return 'bg-cyan-50 border-cyan-200';
      case 'investigation':
        return 'bg-pink-50 border-pink-200';
      case 'office policy and procedures':
        return 'bg-teal-50 border-teal-200';
      case 'authorization':
        return 'bg-lime-50 border-lime-200';
      case 'complaint and inquiry':
        return 'bg-rose-50 border-rose-200';
      case 'policy initiative':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Helper function to get darker border colors for docket type badge hover (copied from Dockets page)
  const getDocketTypeHoverBorderColors = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'petition':
        return 'group-hover:border-blue-600';
      case 'tariff':
        return 'group-hover:border-green-600';
      case 'complaint':
        return 'group-hover:border-red-600';
      case 'contract':
        return 'group-hover:border-purple-600';
      case 'audit':
        return 'group-hover:border-orange-600';
      case 'incident':
        return 'group-hover:border-red-600';
      case 'compliance':
        return 'group-hover:border-emerald-600';
      case 'commission instituted new case proceeding':
        return 'group-hover:border-indigo-600';
      case 'rulemaking':
        return 'group-hover:border-slate-600';
      case 'exception from disclosure':
        return 'group-hover:border-gray-600';
      case 'company workpapers':
        return 'group-hover:border-amber-600';
      case 'analysis':
        return 'group-hover:border-cyan-600';
      case 'investigation':
        return 'group-hover:border-pink-600';
      case 'office policy and procedures':
        return 'group-hover:border-teal-600';
      case 'authorization':
        return 'group-hover:border-lime-600';
      case 'complaint and inquiry':
        return 'group-hover:border-rose-600';
      case 'policy initiative':
        return 'group-hover:border-yellow-600';
      default:
        return 'group-hover:border-gray-600';
    }
  };


  // Real dockets with many filings organized by category
  const curatedSections = [
    {
      title: "Recent Rate Cases",
      description: "Latest utility rate adjustment proceedings",
      icon: TrendingUp,
      viewAllPath: "/dockets?types=Tariff&subtypes=Major rate",
      dockets: [
        {
          uuid: "f244f2ab-4ace-4738-b64f-768a5dd47e9a",
          docket_govid: "25-G-0378",
          docket_title: "Proceeding on Motion of the Commission as to the Rates, Charges, Rules and Regulations of New York State Electric & Gas Corporation for Gas Service.",
          docket_description: null,
          industry: "Gas",
          docket_type: "Tariff",
          docket_subtype: "Major rate",
          petitioner_strings: ["New York State Electric & Gas"],
          opened_date: "2025-06-30",
          current_status: "",
          petitioner: "New York State Electric & Gas"
        },
        {
          uuid: "1ae4a267-fad7-4e3f-a18c-108b0e809c0a",
          docket_govid: "25-E-0375",
          docket_title: "Proceeding on Motion of the Commission as to the Rates, Charges, Rules and Regulations of New York State Electric & Gas Corporation for Electric Service",
          docket_description: null,
          industry: "Electric",
          docket_type: "Tariff",
          docket_subtype: "Major rate", 
          petitioner_strings: ["New York State Electric & Gas"],
          opened_date: "2025-06-30",
          current_status: "",
          petitioner: "New York State Electric & Gas"
        },
        {
          uuid: "8585e97f-5c4a-47e7-aeba-8f39d453c259",
          docket_govid: "25-E-0072",
          docket_title: "Proceeding on Motion of the Commission as to the Rates, Charges, Rules and Regulations of Consolidated Edison Company of New York, Inc. for Electric Service.",
          docket_description: null,
          industry: "Electric",
          docket_type: "Tariff",
          docket_subtype: "Major rate",
          petitioner_strings: ["Consolidated Edison Company of New York"],
          opened_date: "2025-01-31",
          current_status: "",
          petitioner: "Consolidated Edison Company of New York"
        },
        {
          uuid: "e4a7be29-f6f5-4b79-8172-3d4869dd1520",
          docket_govid: "24-G-0668",
          docket_title: "Proceeding on Motion of the Commission as to the Rates, Charges, Rules and Regulations of Liberty Utilities (St. Lawrence Gas) Corp. for Gas Service.",
          docket_description: null,
          industry: "Gas",
          docket_type: "Tariff",
          docket_subtype: "Major rate",
          petitioner_strings: ["Liberty Utilities (St. Lawrence Gas)"],
          opened_date: "2024-11-27",
          current_status: "",
          petitioner: "Liberty Utilities (St. Lawrence Gas)"
        }
      ],
    },
    {
      title: "Major Energy Projects",
      description: "Large-scale renewable energy facility applications",
      icon: Zap,
      viewAllPath: "/dockets?types=Petition&industries=Facility Gen.",
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
      viewAllPath: "/dockets?industries=Communication,Miscellaneous&types=Tariff,Rulemaking",
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
                                <Badge variant="outline" className={`inline-flex items-center gap-1.5 transition-colors ${getDocketTypeBadgeColors(docket.docket_type)} ${getDocketTypeHoverBorderColors(docket.docket_type)}`}>
                                  {(() => {
                                    const TypeIcon = getDocketTypeIcon(docket.docket_type);
                                    const typeColor = getDocketTypeColor(docket.docket_type);
                                    return <TypeIcon size={12} className={typeColor} />;
                                  })()}
                                  {docket.docket_type}
                                </Badge>
                              )}
                              {docket.docket_subtype && <Badge variant="outline" className="border-gray-300 bg-background group-hover:border-primary/30 transition-colors">{docket.docket_subtype}</Badge>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {docket.industry && (
                                <Badge variant="outline" className="inline-flex items-center gap-1.5 border-gray-300 bg-background group-hover:border-primary/30 transition-colors">
                                  {(() => {
                                    const IndustryIcon = getIndustryIcon(docket.industry);
                                    return <IndustryIcon size={12} className={getIndustryColor(docket.industry)} />;
                                  })()}
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
                    to={section.viewAllPath || "/dockets"} 
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