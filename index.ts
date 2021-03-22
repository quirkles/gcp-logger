import { createLogger, Logger } from "./logger";

let logger: Logger;

exports.main = async (_: unknown, context: { eventId: string }) => {
  logger = createLogger("logger-test-func")
    .setResourceType("cloud_function")
    .addLabel("eventId", context.eventId as string)
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
};

exports.main({}, { eventId: "test-abcd" });
