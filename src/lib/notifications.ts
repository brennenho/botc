"use client";

import { toast, type ExternalToast } from "sonner";

import type { AppError } from "@/lib/app-error";

const defaultOptions = {
  success: { duration: 3000 },
  info: { duration: 4000 },
  error: { duration: 6000 },
} as const;

export const notify = {
  success(message: string, options?: ExternalToast) {
    return toast.success(message, { ...defaultOptions.success, ...options });
  },
  info(message: string, options?: ExternalToast) {
    return toast.info(message, { ...defaultOptions.info, ...options });
  },
  error(message: string, options?: ExternalToast) {
    return toast.error(message, { ...defaultOptions.error, ...options });
  },
  appError(error: AppError, options?: ExternalToast) {
    return toast.error(error.message, {
      ...defaultOptions.error,
      id: options?.id ?? `app-error:${error.code}:${error.message}`,
      ...options,
    });
  },
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
};
