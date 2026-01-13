import { useState, useCallback, useEffect, useRef } from "react";

interface UseSidebarResizeOptions {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  storageKey?: string;
}

export function useSidebarResize({
  minWidth = 200,
  maxWidth = 500,
  defaultWidth = 288,
  storageKey = "sidebar-width",
}: UseSidebarResizeOptions = {}) {
  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? parseInt(stored, 10) : defaultWidth;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const previousWidth = useRef(width);

  // Save width to localStorage
  useEffect(() => {
    if (!isCollapsed) {
      localStorage.setItem(storageKey, String(width));
    }
  }, [width, isCollapsed, storageKey]);

  // Start resize
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle mouse move and up during resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, minWidth, maxWidth]);

  // Toggle collapse
  const toggle = useCallback(() => {
    if (isCollapsed) {
      setWidth(previousWidth.current);
    } else {
      previousWidth.current = width;
    }
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, width]);

  // Keyboard shortcut: Cmd+B / Ctrl+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return {
    width: isCollapsed ? 0 : width,
    isCollapsed,
    isResizing,
    toggle,
    startResize,
  };
}
