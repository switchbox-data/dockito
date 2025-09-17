import { useEffect, useState } from "react";

const KeyboardShortcut = ({ keys = ["mod", "k"], className = "" }: { keys?: string[], className?: string }) => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const getKeyDisplay = (key: string) => {
    if (key === "mod") {
      return isMac ? "⌘" : "Ctrl";
    }
    return key.toUpperCase();
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <span key={index} className="inline-flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 text-xs font-medium bg-background border border-border rounded-md shadow-sm text-foreground">
            {getKeyDisplay(key)}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-muted-foreground mx-0.5">+</span>
          )}
        </span>
      ))}
    </div>
  );
};

export default KeyboardShortcut;