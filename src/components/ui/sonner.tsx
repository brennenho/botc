"use client";

import { CircleAlert, Check, Info, TriangleAlert } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { Spinner } from "@/components/ui/spinner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      visibleToasts={2}
      duration={5000}
      gap={6}
      icons={{
        success: <Check aria-hidden="true" />,
        info: <Info aria-hidden="true" />,
        warning: <TriangleAlert aria-hidden="true" />,
        error: <CircleAlert aria-hidden="true" />,
        loading: <Spinner />,
      }}
      offset={{ top: "max(14px, env(safe-area-inset-top))" }}
      mobileOffset={{ top: "max(10px, env(safe-area-inset-top))" }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "app-toast",
          content: "app-toast-content",
          title: "app-toast-title",
          description: "app-toast-description",
          icon: "app-toast-icon",
          actionButton: "app-toast-action",
          success: "is-success",
          info: "is-info",
          warning: "is-warning",
          error: "is-error",
        },
      }}
      {...props}
    />
  );
}
