import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { DocketHeader } from "@/components/DocketHeader";
import { FilingsList } from "@/components/FilingsList";
import type { FilingWithAttachments } from "@/components/FilingsList";
type DocketType = {
  uuid: string;
  docket_govid: string;
  docket_title: string | null;
  docket_description: string | null;
  industry: string | null;
  docket_type: string | null;
  petitioner_strings: string[] | null;
  opened_date: string;
  closed_date?: string | null;
  docket_subtype: string | null;
  current_status: string | null;
  hearing_officer?: string | null;
  assigned_judge?: string | null;
};
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const DocketPage = () => {
  const { docket_govid } = useParams<{ docket_govid: string }>();

  const { data: docket, isLoading: docketLoading } = useQuery({
    queryKey: ["docket", docket_govid],
    enabled: !!docket_govid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dockets")
        .select("*")
        .eq("docket_govid", docket_govid!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: filings, isLoading: filingsLoading } = useQuery<FilingWithAttachments[]>({
    queryKey: ["docket-filings", docket?.docket_govid],
    enabled: !!docket,
    queryFn: async () => {
      const { data: fills, error } = await supabase
        .from("fillings")
        .select("*")
        .eq("docket_govid", docket!.docket_govid);
      if (error) throw error;
      const uuids = (fills ?? []).map((f: any) => f.uuid);
      if (uuids.length === 0) return [];
      const { data: atts, error: aerr } = await supabase
        .from("attachments")
        .select("*")
        .in("parent_filling_uuid", uuids);
      if (aerr) throw aerr;
      const byParent = new Map<string, any[]>();
      (atts ?? []).forEach((a: any) => {
        const arr = byParent.get(a.parent_filling_uuid) ?? [];
        arr.push(a);
        byParent.set(a.parent_filling_uuid, arr);
      });
      const combined = (fills ?? []).map((f: any) => ({ ...f, attachments: byParent.get(f.uuid) ?? [] }));
      return combined as FilingWithAttachments[];
    },
  });

  useEffect(() => {
    const title = docket
      ? `Docket ${docket.docket_govid} | NY PSC`
      : docketLoading
      ? "Loading docket | NY PSC"
      : "Docket not found | NY PSC";
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", docket?.docket_description || docket?.docket_title || "PUC docket");
  }, [docket, docketLoading]);

  if (docketLoading) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl font-semibold mb-2">Loading docket…</h1>
      </main>
    );
  }

  if (!docket) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl font-semibold mb-2">Docket not found</h1>
        <p className="text-muted-foreground">Use Cmd/Ctrl + K to search for a docket.</p>
      </main>
    );
  }

  return (
    <main className="container py-8 space-y-6">
      <DocketHeader docket={docket} />
      {filingsLoading ? (
        <div className="text-muted-foreground">Loading filings…</div>
      ) : (
        <FilingsList filings={filings ?? []} />
      )}
    </main>
  );
};

export default DocketPage;
