"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
let logger;
exports.main = (_, context) => __awaiter(void 0, void 0, void 0, function* () {
    logger = logger_1.createLogger("logger-test-func")
        .setResourceType("cloud_function")
        .addLabel("eventId", context.eventId)
        .mergeToResourceLabels({
        function_name: "logger-test",
        project_id: "makegoodfood-analytics",
        region: "us-east1",
    });
    logger.info("info");
    logger.info({ someValue: true }, "info");
    logger.warning("warning");
    logger.warning({ someValue: true }, "warning");
    logger.error("error");
    logger.error(new Error("oooops"), "error");
});
exports.main({}, { eventId: "test-abcd" });
