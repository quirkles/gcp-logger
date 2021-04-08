import { randomBytes } from "crypto";

import { Logging } from "@google-cloud/logging";
import { ApiResponse, Metadata } from "@google-cloud/logging/build/src/log";

export type LogLevel =
  | "emergency"
  | "alert"
  | "critical"
  | "error"
  | "warning"
  | "notice"
  | "info"
  | "debug";

export type LogMessage =
  | string
  | { message: string; additionalData: Record<string, unknown> };

type LogWriter = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  additionalDataOrMessage: Error | object | string,
  maybeMessage?: string
) => Promise<ApiResponse>;

// eslint-disable-next-line @typescript-eslint/ban-types
type SubscriptionCallback = (logMessage: LogMessage) => unknown;

type UnsubscribeFunction = () => void;

export interface Subscription {
  logLevel: LogLevel;
  id: string;
  callBack: SubscriptionCallback;
}

export interface Logger {
  emergency: LogWriter;
  alert: LogWriter;
  critical: LogWriter;
  error: LogWriter;
  warning: LogWriter;
  notice: LogWriter;
  info: LogWriter;
  debug: LogWriter;

  addLabel(propName: string, value: string): Logger;
  addResourceLabel(propName: string, value: string): Logger;
  mergeToLabels(obj: Record<string, unknown>): Logger;
  mergeToResourceLabels(obj: Record<string, unknown>): Logger;
  setResourceType(resourceType: string): Logger;

  enableConsoleLogging(): Logger;

  on(logLevel: LogLevel, callback: SubscriptionCallback): UnsubscribeFunction;
}

export const createLogger = (projectId: string, logName: string): Logger => {
  const logging = new Logging({ projectId });
  const log = logging.log(logName);
  let logToConsole = false;

  let subscriptions: Subscription[] = [];

  const baseMetaData: Metadata = {
    resource: {
      type: "global",
      labels: {},
    },
    labels: {},
  };
  const writeLog = (severity: LogLevel): LogWriter => (
    additionalDataOrMessage,
    maybeMessage
  ) => {
    let additionalData: Record<string, unknown> | null = null;
    let message: string;
    if (maybeMessage) {
      additionalData = additionalDataOrMessage as Record<string, unknown>;
      message = maybeMessage as string;
    } else {
      message = additionalDataOrMessage as string;
    }
    const baseMetaDataWithSeverity: Metadata = {
      ...baseMetaData,
      severity: severity.toUpperCase(),
    };
    let logMessage: LogMessage;
    if (!additionalData) {
      logMessage = message;
    } else {
      logMessage = {
        additionalData,
        message,
      };
    }
    const entry = log.entry(baseMetaDataWithSeverity, logMessage);
    if (logToConsole) {
      console.log(logMessage);
    }
    return log.write(entry).then((metaData) => {
      subscriptions
        .filter((sub) => sub.logLevel === severity)
        .map((sub) => sub.callBack)
        .forEach((callBack) => {
          try {
            (callBack as LogWriter)(logMessage);
          } catch {}
        });
      return metaData;
    });
  };

  return {
    enableConsoleLogging(): Logger {
      logToConsole = true;
      return this;
    },
    addLabel(propName: string, value: string) {
      baseMetaData.labels[propName] = value;
      return this;
    },
    addResourceLabel(propName: string, value: string) {
      baseMetaData.resource.labels[propName] = value;
      return this;
    },
    mergeToLabels(obj: Record<string, unknown>) {
      baseMetaData.labels = {
        ...obj,
        ...baseMetaData.labels,
      };
      return this;
    },
    mergeToResourceLabels(obj: Record<string, unknown>) {
      baseMetaData.resource.labels = {
        ...obj,
        ...baseMetaData.resource.labels,
      };
      return this;
    },
    setResourceType(resourceType: string) {
      baseMetaData.resource.type = resourceType;
      return this;
    },
    emergency: writeLog("emergency"),
    alert: writeLog("alert"),
    critical: writeLog("critical"),
    error: writeLog("error"),
    warning: writeLog("warning"),
    notice: writeLog("notice"),
    info: writeLog("info"),
    debug: writeLog("debug"),
    on(logLevel, callBack) {
      const id = `${Date.now()}-${randomBytes(128).toString("hex")}`;
      subscriptions.push({
        id,
        logLevel,
        callBack,
      });
      return () => {
        subscriptions = subscriptions.filter(
          (sub) => !(sub.logLevel === logLevel && sub.id !== id)
        );
      };
    },
  };
};
