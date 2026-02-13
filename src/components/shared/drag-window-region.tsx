import { getPlatform } from "@/actions/app";
import { closeWindow, maximizeWindow, minimizeWindow } from "@/actions/window";
import { type ReactNode, useEffect, useState } from "react";

interface DragWindowRegionProps {
  title?: ReactNode;
  subtitle?: string;
}

export function DragWindowRegion({ title, subtitle }: DragWindowRegionProps) {
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getPlatform()
      .then((value) => {
        if (!active) {
          return;
        }

        setPlatform(value);
      })
      .catch((error) => {
        console.error("Failed to detect platform", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const isMacOS = platform === "darwin";

  return (
    <div className="bg-bg-base-deepest border-border-dark flex h-9.5 w-full shrink-0 items-stretch justify-between border-b">
      <div className="draglayer w-full">
        {!isMacOS && (
          <div className="flex flex-1 items-center px-3 py-2 text-xs whitespace-nowrap select-none">
            {title && (
              <span className="text-foreground font-semibold">{title}</span>
            )}
            {subtitle && (
              <>
                <span className="text-muted-foreground mx-1.5">&mdash;</span>
                <span className="text-muted-foreground">{subtitle}</span>
              </>
            )}
          </div>
        )}
        {isMacOS && (
          <div className="flex flex-1 items-center px-3 py-2">
            {title && (
              <span className="text-foreground pl-16 text-xs font-semibold">
                {title}
              </span>
            )}
            {subtitle && (
              <>
                <span className="text-muted-foreground mx-1.5 text-xs">
                  &mdash;
                </span>
                <span className="text-muted-foreground text-xs">
                  {subtitle}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      {!isMacOS && <WindowButtons />}
    </div>
  );
}

function WindowButtons() {
  return (
    <div className="text-muted-foreground flex">
      <button
        title="Minimize"
        type="button"
        className="hover:bg-bg-hover hover:text-foreground px-3 py-2 transition-colors duration-150"
        onClick={minimizeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect fill="currentColor" width="10" height="1" x="1" y="6"></rect>
        </svg>
      </button>
      <button
        title="Maximize"
        type="button"
        className="hover:bg-bg-hover hover:text-foreground px-3 py-2 transition-colors duration-150"
        onClick={maximizeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect
            width="9"
            height="9"
            x="1.5"
            y="1.5"
            fill="none"
            stroke="currentColor"
          ></rect>
        </svg>
      </button>
      <button
        type="button"
        title="Close"
        className="hover:bg-efis-red hover:text-foreground px-3 py-2 transition-colors duration-150"
        onClick={closeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <polygon
            fill="currentColor"
            fillRule="evenodd"
            points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
          ></polygon>
        </svg>
      </button>
    </div>
  );
}
