import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { DocketHeader } from "@/components/DocketHeader";
import { FilingsList } from "@/components/FilingsList";
import { MOCK_ATTACHMENTS, MOCK_DOCKETS, MOCK_FILLINGS } from "@/data/mock";

const DocketPage = () => {
  const { docket_govid } = useParams<{ docket_govid: string }>();
  const docket = MOCK_DOCKETS.find((d) => d.docket_govid === docket_govid);

  useEffect(() => {
    const title = docket ? `${docket.docket_govid} • ${docket.docket_title}` : "Docket not found";
    document.title = `${title} | docket-stream`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', docket?.docket_description || docket?.docket_title || 'PUC docket');
  }, [docket]);

  if (!docket) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl font-semibold mb-2">Docket not found</h1>
        <p className="text-muted-foreground">Use Cmd/Ctrl + K to search for a docket.</p>
      </main>
    );
  }

  const filings = MOCK_FILLINGS
    .filter((f) => f.docket_govid === docket.docket_govid)
    .map((f) => ({
      ...f,
      attachments: MOCK_ATTACHMENTS.filter((a) => a.parent_filling_uuid === f.uuid),
    }));

  return (
    <main className="container py-8 space-y-6">
      <DocketHeader docket={docket} />
      <FilingsList filings={filings} />
    </main>
  );
};

export default DocketPage;
