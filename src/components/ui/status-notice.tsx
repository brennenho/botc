"use client";

import { CircleAlert, RefreshCw, Unplug, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function StatusNotice({
  tone,
  title,
  message,
  actionLabel,
  actionPending = false,
  onAction,
  onDismiss,
}: {
  tone: "danger" | "connection";
  title: string;
  message?: string;
  actionLabel?: string;
  actionPending?: boolean;
  onAction?: () => void;
  onDismiss?: () => void;
}) {
  const Icon = tone === "connection" ? Unplug : CircleAlert;

  return (
    <aside
      className={`status-notice is-${tone}`}
      role="alert"
      aria-atomic="true"
    >
      <span className="status-notice-icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="status-notice-copy">
        <strong>{title}</strong>
        {message ? <span>{message}</span> : null}
      </span>
      {(onAction ?? onDismiss) && (
        <span className="status-notice-actions">
          {onAction && actionLabel ? (
            <Button
              type="button"
              variant="quiet"
              size="sm"
              className="status-notice-action"
              pending={actionPending}
              onClick={onAction}
            >
              <RefreshCw aria-hidden="true" />
              {actionLabel}
            </Button>
          ) : null}
          {onDismiss ? (
            <Button
              type="button"
              variant="quiet"
              size="icon"
              className="status-notice-dismiss"
              aria-label="Dismiss notification"
              onClick={onDismiss}
            >
              <X aria-hidden="true" />
            </Button>
          ) : null}
        </span>
      )}
    </aside>
  );
}
