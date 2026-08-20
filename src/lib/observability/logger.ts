import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";

import { env } from "@/env";
import { observabilityEnabled } from "@/lib/observability/config";
import {
  normalizeLogContext,
  runtimeLogContext,
  type LogContext,
} from "@/lib/observability/context";
import { errorLogContext } from "@/lib/observability/error-details";

export type LogLevel = "error" | "info" | "warn";
type OpenTelemetryLogger = ReturnType<LoggerProvider["getLogger"]>;
type LoggingState = {
  logger: OpenTelemetryLogger;
  provider: LoggerProvider;
};

let loggingState: LoggingState | null | undefined;

function getLoggingState() {
  if (loggingState !== undefined) return loggingState;
  if (!observabilityEnabled) {
    loggingState = null;
    return loggingState;
  }

  try {
    const exporter = new OTLPLogExporter({
      headers: {
        Authorization: `Bearer ${env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN}`,
        "Content-Type": "application/json",
      },
      url: new URL("/i/v1/logs", env.NEXT_PUBLIC_POSTHOG_HOST).toString(),
    });
    const provider = new LoggerProvider({
      processors: [
        new BatchLogRecordProcessor({
          exporter,
          // Start each export immediately. This avoids request-scoped forceFlush
          // calls while remaining on PostHog's recommended batch processor.
          maxExportBatchSize: 1,
          maxQueueSize: 128,
          exportTimeoutMillis: 3_000,
        }),
      ],
      resource: resourceFromAttributes(
        normalizeLogContext(runtimeLogContext()),
      ),
    });

    loggingState = {
      logger: provider.getLogger("botc-server"),
      provider,
    };
  } catch (error) {
    loggingState = null;
    writeConsole("error", "Unable to initialize server logging.", {
      component: "observability",
      ...errorLogContext(error),
    });
  }

  return loggingState;
}

function writeConsole(
  level: LogLevel,
  message: string,
  context: LogContext = {},
) {
  if (env.NODE_ENV === "test") return;

  const output = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...normalizeLogContext(runtimeLogContext()),
    ...normalizeLogContext(context),
  });

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.info(output);
  }
}

export function registerServerLogging() {
  const state = getLoggingState();
  if (!state) return;

  try {
    logs.setGlobalLoggerProvider(state.provider);
  } catch (error) {
    writeConsole("error", "Unable to register server logging.", {
      component: "observability",
      ...errorLogContext(error),
    });
  }
}

function writeLog(level: LogLevel, message: string, context: LogContext = {}) {
  writeConsole(level, message, context);

  const state = getLoggingState();
  if (!state) return;

  try {
    const severityNumber = {
      error: SeverityNumber.ERROR,
      info: SeverityNumber.INFO,
      warn: SeverityNumber.WARN,
    }[level];

    state.logger.emit({
      attributes: normalizeLogContext(context),
      body: message,
      severityNumber,
      severityText: level.toUpperCase(),
    });
  } catch (error) {
    writeConsole("error", "Unable to write server log.", {
      component: "observability",
      original_log_level: level,
      original_log_message: message,
      ...errorLogContext(error),
    });
  }
}

export const logger = {
  error(message: string, context?: LogContext) {
    writeLog("error", message, context);
  },
  info(message: string, context?: LogContext) {
    writeLog("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    writeLog("warn", message, context);
  },
};
