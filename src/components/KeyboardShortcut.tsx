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
          <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-medium bg-muted border border-border rounded shadow-sm">
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