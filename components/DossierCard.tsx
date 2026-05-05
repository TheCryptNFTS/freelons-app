import { ReactNode } from "react";

type Props = {
  fileNo?: string;
  clearance?: "BLUE" | "RED" | "GOLD";
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  stampLabel?: string;
  stampColor?: "purple" | "red" | "green" | "gold";
  stampRotation?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  punchHoles?: boolean;
  fileTab?: string;
  ratio?: string; // e.g. "1 / 1" or "auto"
};

export default function DossierCard({
  fileNo = "FHD-1986-X",
  clearance = "BLUE",
  title,
  subtitle,
  children,
  footer,
  stampLabel,
  stampColor = "purple",
  stampRotation = 2,
  className = "",
  punchHoles = false,
  fileTab,
  ratio = "auto",
}: Props) {
  return (
    <div
      className={`paper relative w-full max-w-4xl mx-auto ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {fileTab && <div className="file-tab">{fileTab}</div>}
      {punchHoles && (
        <div className="punch-holes">
          <div /><div /><div />
        </div>
      )}

      <div className="relative z-10 h-full flex flex-col p-7 md:p-12">
        {/* Header */}
        <div className="flex justify-between items-start text-[10px] md:text-xs">
          <div className="font-bold tracking-[3px]">FREELONS — HEX SIGNAL DIVISION</div>
          <div className="text-right">
            <div>FILE: <span className="font-bold">{fileNo}</span></div>
            <div>CLEARANCE: <span className="text-purple font-bold">{clearance}</span></div>
          </div>
        </div>

        <div className="mt-3 border-b border-purple/60" />

        {/* Body */}
        <div className="flex-1 flex flex-col justify-start pt-8">
          {title && <h1 className="display-h">{title}</h1>}
          {subtitle && <p className="text-xs md:text-sm mt-3 tracking-[3px] uppercase opacity-90">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>

        {/* Stamp */}
        {stampLabel && (
          <div className="absolute top-20 right-10 md:top-24 md:right-16 select-none pointer-events-none">
            <div
              className={`stamp ${stampColor === "purple" ? "" : stampColor}`}
              data-rot={stampRotation}
              data-text={stampLabel}
            >
              {stampLabel}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer-strip mt-auto -mx-7 md:-mx-12 -mb-7 md:-mb-12">
          <div>404 HEX <span className="alt">NOT FOUND</span></div>
          <div className="barcode hidden md:block" />
        </div>

        {footer && <div className="absolute bottom-24 left-7 right-7 md:left-12 md:right-12 z-20">{footer}</div>}
      </div>
    </div>
  );
}
