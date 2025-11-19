"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ReasoningContextValue {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  isStreaming: boolean;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

function useReasoningContext() {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within <Reasoning>");
  }
  return context;
}

export interface ReasoningProps {
  children: React.ReactNode;
  className?: string;
  /** Indicates whether the reasoning content is currently streaming */
  isStreaming: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Uncontrolled initial state */
  defaultOpen?: boolean;
  /** Called whenever the open state changes */
  onOpenChange?: (value: boolean) => void;
}

export function Reasoning({
  children,
  className,
  isStreaming,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: ReasoningProps) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen || isStreaming);
  const open = isControlled ? (openProp as boolean) : internalOpen;
  const previousStreaming = useRef<boolean>(isStreaming);

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (isStreaming && !previousStreaming.current) {
      setOpen(true);
    } else if (!isStreaming && previousStreaming.current) {
      setOpen(false);
    }

    previousStreaming.current = isStreaming;
  }, [isStreaming, setOpen]);

  const contextValue = useMemo<ReasoningContextValue>(
    () => ({
      isOpen: open,
      setOpen,
      isStreaming,
    }),
    [open, setOpen, isStreaming],
  );

  return (
    <ReasoningContext.Provider value={contextValue}>
      <div className={cn("w-full", className)}>{children}</div>
    </ReasoningContext.Provider>
  );
}

export interface ReasoningTriggerRenderArgs {
  isOpen: boolean;
  isStreaming: boolean;
}

export interface ReasoningTriggerProps {
  children?: React.ReactNode | ((args: ReasoningTriggerRenderArgs) => React.ReactNode);
  className?: string;
  /** Prevent toggling while streaming */
  disabledWhileStreaming?: boolean;
}

export function ReasoningTrigger({ children, className, disabledWhileStreaming = true }: ReasoningTriggerProps) {
  const { isOpen, setOpen, isStreaming } = useReasoningContext();

  const handleToggle = useCallback(() => {
    if (disabledWhileStreaming && isStreaming) {
      return;
    }
    setOpen(!isOpen);
  }, [disabledWhileStreaming, isStreaming, isOpen, setOpen]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabledWhileStreaming && isStreaming) {
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(!isOpen);
      }
    },
    [disabledWhileStreaming, isStreaming, isOpen, setOpen],
  );

  const content = useMemo(() => {
    if (typeof children === "function") {
      return children({ isOpen, isStreaming });
    }
    return children ?? (
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Reasoning</span>
        <span className="text-[11px] text-muted-foreground/70">{isOpen ? "Masquer" : "Afficher"}</span>
      </div>
    );
  }, [children, isOpen, isStreaming]);

  return (
    <div
      role="button"
      tabIndex={disabledWhileStreaming && isStreaming ? -1 : 0}
      aria-expanded={isOpen}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex w-full select-none items-center justify-between gap-2 px-3 py-2 transition-colors",
        disabledWhileStreaming && isStreaming ? "cursor-default" : "cursor-pointer",
        className,
      )}
    >
      {content}
    </div>
  );
}

export interface ReasoningContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ReasoningContent({ children, className }: ReasoningContentProps) {
  const { isOpen } = useReasoningContext();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="reasoning-content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          className={cn("overflow-hidden", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { useReasoningContext as useReasoning };
