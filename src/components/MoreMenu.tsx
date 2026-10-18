import { ReactNode, useEffect, useRef, useState } from "react";
import styles from "@/styles/Home.module.css";

// the ☰ menu holding secondary actions on small screens
export function MoreMenu(props: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={styles.menu} ref={rootRef}>
      <button
        className={styles.iconButton}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="More options"
        title="More options"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>
      {open && (
        <div
          className={styles.moreList}
          // picking an action closes the menu, unless it asks to stay open to show its result
          onClick={(event) => {
            const item = (event.target as HTMLElement).closest("button, a");
            if (item && !item.hasAttribute("data-keep-open")) setOpen(false);
          }}
        >
          {props.children}
        </div>
      )}
    </div>
  );
}
