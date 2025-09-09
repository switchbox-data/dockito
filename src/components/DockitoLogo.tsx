import { FileText } from "lucide-react";

const DockitoLogo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary rounded p-1.5">
        <FileText className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="font-semibold text-foreground">dockito</span>
    </div>
  );
};

export default DockitoLogo;