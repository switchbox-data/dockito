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
          <kbd className="flex min-h-[22px] min-w-[22px] items-center justify-center rounded-md border border-t border-x border-b-2 border-border bg-background px-1 pt-[3px] pb-0.5 text-xs leading-3 shadow-[0px_1px_0px_1px_hsl(var(--border))] transition-[box-shadow,translate,border] duration-200 ease-out active:translate-y-px">
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