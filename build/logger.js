"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const logging_1 = require("@google-cloud/logging");
const createLogger = (logName) => {
    const projectId = "makegoodfood-analytics";
    const logging = new logging_1.Logging({ projectId });
    const log = logging.log(logName);
    let logToConsole = false;
    const baseMetaData = {
        resource: {
            type: "global",
            labels: {},
        },
        labels: {},
    };
    const writeLog = (severity) => (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalData, message) => {
        let logMessage;
        const baseMetaDataWithSeverity = Object.assign(Object.assign({}, baseMetaData), { severity });
        if (!message) {
            logMessage = additionalData;
        }
        else {
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
        return log.write(entry);
    };
    return {
        enableConsoleLogging() {
            logToConsole = true;
            return this;
        },
        addLabel(propName, value) {
            baseMetaData.labels[propName] = value;
            return this;
        },
        addResourceLabel(propName, value) {
            baseMetaData.resource.labels[propName] = value;
            return this;
        },
        mergeToLabels(obj) {
            baseMetaData.labels = Object.assign(Object.assign({}, obj), baseMetaData.labels);
            return this;
        },
        mergeToResourceLabels(obj) {
            baseMetaData.resource.labels = Object.assign(Object.assign({}, obj), baseMetaData.resource.labels);
            return this;
        },
        setResourceType(resourceType) {
            baseMetaData.resource.type = resourceType;
            return this;
        },
        emergency: writeLog("EMERGENCY"),
        alert: writeLog("ALERT"),
        critical: writeLog("CRITICAL"),
        error: writeLog("ERROR"),
        warning: writeLog("WARNING"),
        notice: writeLog("NOTICE"),
        info: writeLog("INFO"),
        debug: writeLog("DEBUG"),
    };
};
exports.createLogger = createLogger;
