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

type SubscriptionCallBack = () => void;
type UnsubscribeFunction = () => void;

export interface Subscription {
  logLevel: LogLevel;
  id: string;
  callBack: SubscriptionCallBack;
}

export interface Logger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emergency(additionalData: Record<string, any>, message: string): void;
  emergency(data: Record<string, unknown>): void;
  emergency(message: string): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alert(additionalData: Record<string, any>, message: string): void;
  alert(data: Record<string, unknown>): void;
  alert(message: string): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  critical(additionalData: Record<string, any>, message: string): void;
  critical(data: Record<string, unknown>): void;
  critical(message: string): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(additionalData: Record<string, any>, message: string): void;
  error(data: Record<string, unknown>): void;
  error(message: string): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warning(additionalData: Record<string, any>, message: string): void;
  warning(data: Record<string, unknown>): void;
  warning(message: string): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notice(additionalData: Record<string, any>, message: string): void;
  notice(data: Record<string, unknown>): void;
  notice(message: string): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(additionalData: Record<string, any>, message: string): void;
  info(data: Record<string, unknown>): void;
  info(message: string): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(additionalData: Record<string, any>, message: string): void;
  debug(data: Record<string, unknown>): void;
  debug(message: string): void;

  addLabel(propName: string, value: string): Logger;
  addResourceLabel(propName: string, value: string): Logger;
  mergeToLabels(obj: Record<string, unknown>): Logger;
  mergeToResourceLabels(obj: Record<string, unknown>): Logger;
  setResourceType(resourceType: string): Logger;

  enableConsoleLogging(): Logger;

  on(logLevel: LogLevel, callback: SubscriptionCallBack): UnsubscribeFunction;
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

  const writeLog = (severity: LogLevel) => (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalData: Record<string, any> | string,
    message?: string | Record<string, unknown>
  ): Promise<ApiResponse> => {
    let logMessage: string | Record<string, unknown>;
    const baseMetaDataWithSeverity: Metadata = {
      ...baseMetaData,
      severity: severity.toUpperCase(),
    };
    if (!message) {
      logMessage = additionalData;
    } else {
      logMessage = { additionalData, message };
    }
    const entry = log.entry(baseMetaDataWithSeverity, logMessage);
    if (logToConsole) {
      if (additionalData) {
        console.log(additionalData);
      }
      if (message) {
        console.log(message);
      }
    }
    return log.write(entry).then((metaData) => {
      subscriptions
        .filter((sub) => sub.logLevel === severity)
        .map((sub) => sub.callBack)
        .forEach((cb) => {
          try {
            cb();
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
