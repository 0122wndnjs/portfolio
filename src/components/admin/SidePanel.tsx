"use client";

import { useEffect, type ReactNode } from "react";
import { FiX } from "react-icons/fi";

/** Right-hand side panel used for every "open / add" flow in the redesign. */
export default function SidePanel({
  title,
  eyebrow,
  onClose,
  children,
  footer,
}: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="rd-panel-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="rd-panel" role="dialog" aria-modal="true" aria-label={title}>
        <header className="rd-panel-head">
          <div>
            {eyebrow && <span className="rd-eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button type="button" className="rd-icon-plain" aria-label="닫기" onClick={onClose}><FiX /></button>
        </header>
        <div className="rd-panel-body">{children}</div>
        {footer && <footer className="rd-panel-foot">{footer}</footer>}
      </section>
    </div>
  );
}
