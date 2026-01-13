import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LineHoverButtonProps {
  getHoveredLine: () => { lineNumber: number; side: "additions" | "deletions" } | undefined;
  onAddComment: (line: { lineNumber: number; side: "old" | "new" }) => void;
}

export function LineHoverButton({ getHoveredLine, onAddComment }: LineHoverButtonProps) {
  const [hoveredLine, setHoveredLine] = useState<{
    lineNumber: number;
    side: "additions" | "deletions";
  } | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Poll for hovered line position
  useEffect(() => {
    const interval = setInterval(() => {
      const line = getHoveredLine();

      if (line) {
        setHoveredLine(line);

        // Find the line element in the DOM
        const lineElement = document.querySelector(
          `[data-line-number="${line.lineNumber}"][data-side="${line.side}"]`
        ) as HTMLElement;

        if (lineElement) {
          const rect = lineElement.getBoundingClientRect();
          const container = lineElement.closest('.pierre-diffs') as HTMLElement;

          if (container) {
            const containerRect = container.getBoundingClientRect();
            setPosition({
              top: rect.top - containerRect.top + (rect.height / 2) - 12,
              left: 4,
            });
          }
        } else {
          // Fallback: try to find by searching all code rows
          const allRows = document.querySelectorAll('[data-line-info]');
          for (const row of allRows) {
            const lineInfo = row.getAttribute('data-line-info');
            if (lineInfo) {
              try {
                const info = JSON.parse(lineInfo);
                if (info.lineNumber === line.lineNumber) {
                  const rect = (row as HTMLElement).getBoundingClientRect();
                  const container = row.closest('.pierre-diffs, pre') as HTMLElement;
                  if (container) {
                    const containerRect = container.getBoundingClientRect();
                    setPosition({
                      top: rect.top - containerRect.top + (rect.height / 2) - 12,
                      left: 4,
                    });
                  }
                  break;
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } else {
        setHoveredLine(null);
        setPosition(null);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [getHoveredLine]);

  const handleClick = useCallback(() => {
    if (hoveredLine) {
      onAddComment({
        lineNumber: hoveredLine.lineNumber,
        side: hoveredLine.side === "additions" ? "new" : "old",
      });
    }
  }, [hoveredLine, onAddComment]);

  if (!hoveredLine || !position) return null;

  return (
    <Button
      size="icon"
      variant="default"
      className="absolute z-50 h-6 w-6 rounded-full shadow-md opacity-80 hover:opacity-100 transition-opacity"
      style={{
        top: position.top,
        left: position.left,
      }}
      onClick={handleClick}
    >
      <Plus className="h-3 w-3" />
    </Button>
  );
}
