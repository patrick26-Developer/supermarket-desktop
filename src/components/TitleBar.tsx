import { Copy, Minus, Square, Store, X } from "lucide-react";
import { useEffect, useState } from "react";

function TitleBarButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Minus;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-9 w-11 items-center justify-center text-muted-foreground transition-colors [-webkit-app-region:no-drag] ${
        danger
          ? "hover:bg-destructive hover:text-destructive-foreground"
          : "hover:bg-secondary hover:text-secondary-foreground"
      }`}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.windowControls.isMaximized().then(setIsMaximized);
    return window.windowControls.onMaximizedChange(setIsMaximized);
  }, []);

  return (
    <div
      className="flex h-9 shrink-0 items-center border-b border-border bg-card [-webkit-app-region:drag]"
      onDoubleClick={() => window.windowControls.maximizeToggle()}
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <Store className="size-3.5 text-primary" />
        <span className="font-display text-xs font-medium tracking-tight text-foreground/80">
          Superette
        </span>
      </div>

      <div className="flex h-full items-stretch">
        <TitleBarButton icon={Minus} label="Réduire" onClick={() => window.windowControls.minimize()} />
        <TitleBarButton
          icon={isMaximized ? Copy : Square}
          label={isMaximized ? "Restaurer" : "Agrandir"}
          onClick={() => window.windowControls.maximizeToggle()}
        />
        <TitleBarButton icon={X} label="Fermer" danger onClick={() => window.windowControls.close()} />
      </div>
    </div>
  );
}
