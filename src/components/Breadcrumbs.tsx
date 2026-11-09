import React from "react";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  action?: () => void;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onHomeAction?: () => void;
  showBackButton?: boolean;
  onBackAction?: () => void;
}

export default function Breadcrumbs({ 
  items, 
  onHomeAction, 
  showBackButton = false, 
  onBackAction 
}: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className="bg-neutral-900/60 border border-neutral-800/80 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400 font-medium shadow-lg backdrop-blur-sm"
    >
      <div className="flex items-center flex-wrap gap-2 text-neutral-400">
        {/* Home Item */}
        <button
          onClick={() => onHomeAction?.()}
          className="hover:text-emerald-400 transition flex items-center space-x-1 bg-neutral-950/60 hover:bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-850 cursor-pointer text-neutral-300 hover:border-emerald-500/20"
          title="Return to Public Home"
        >
          <Home size={12} className="text-emerald-400" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Home</span>
        </button>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <ChevronRight size={11} className="text-neutral-600 shrink-0 mx-0.5" />
              <div className="flex items-center space-x-1.5">
                {item.icon && <span className="text-neutral-500 flex items-center">{item.icon}</span>}
                {isLast || !item.action ? (
                  <span className={`px-2 py-1 rounded-lg ${
                    isLast 
                      ? "text-emerald-400 font-black bg-emerald-950/20 border border-emerald-500/10" 
                      : "text-neutral-300 font-semibold"
                  }`}>
                    {item.label}
                  </span>
                ) : (
                  <button
                    onClick={item.action}
                    className="hover:text-emerald-400 hover:bg-neutral-950 transition cursor-pointer px-2 py-1 rounded-lg border border-transparent hover:border-neutral-850 text-neutral-300 font-medium"
                  >
                    {item.label}
                  </button>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Optional quick Back button for fast, context-aware layout navigation */}
      {showBackButton && onBackAction && (
        <button
          onClick={onBackAction}
          className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-neutral-400 hover:text-white transition bg-neutral-950 border border-neutral-850 px-3 py-1.5 rounded-xl cursor-pointer hover:border-neutral-700"
        >
          <ArrowLeft size={11} />
          <span className="uppercase tracking-wider font-mono">Back</span>
        </button>
      )}
    </nav>
  );
}
