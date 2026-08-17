import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";

import { env } from "@/env";

type LogAttribute = string | number | boolean;
type LogAttributes = Record<string, LogAttribute>;
type LogLevel = "error" | "info" | "warn";
type Logger = ReturnType<LoggerProvider["getLogger"]>;
type LoggingState = { logger: Logger; provider: LoggerProvider };

const captureInCurrentEnvironment =
  env.NEXT_PUBLIC_POSTHOG_DISABLED !== "true" &&
  (env.NODE_ENV === "production" ||
    env.NEXT_PUBLIC_POSTHOG_CAPTURE_IN_DEVELOPMENT === "true");

let loggingState: LoggingState | null | undefined;

function getLoggingState() {
  if (loggingState !== undefined) return loggingState;
  if (!captureInCurrentEnvironment) {
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
      processors: [new BatchLogRecordProcessor({ exporter })],
      resource: resourceFromAttributes({
        "deployment.environment": env.NODE_ENV,
        "service.name": "botc",
      }),
    });

    loggingState = {
      logger: provider.getLogger("botc-server"),
      provider,
    };
  } catch (error) {
    loggingState = null;
    console.error("Unable to initialize server logging.", error);
  }

  return loggingState;
}

export function registerServerLogging() {
  const state = getLoggingState();
  if (!state) return;

  try {
    logs.setGlobalLoggerProvider(state.provider);
  } catch (error) {
    console.error("Unable to register server logging.", error);
  }
}

export function logServerEvent(
  level: LogLevel,
  message: string,
  attributes: LogAttributes = {},
) {
  const state = getLoggingState();
  if (!state) return;

  try {
    const severityNumber = {
      error: SeverityNumber.ERROR,
      info: SeverityNumber.INFO,
      warn: SeverityNumber.WARN,
    }[level];

    state.logger.emit({
      attributes,
      body: message,
      severityNumber,
      severityText: level.toUpperCase(),
    });
  } catch (error) {
    console.error("Unable to write server log.", error);
  }
}

export async function flushServerLogs() {
  const state = getLoggingState();
  if (!state) return;

  try {
    await state.provider.forceFlush({ timeoutMillis: 5_000 });
  } catch (error) {
    console.error("Unable to flush server logs.", error);
  }
}
