# GCP Logger

## What?

This is a small wrapper around the [gcp logger client library](https://cloud.google.com/logging/docs/reference/libraries) enabling a simpler interface to the logging client.

## Why?

The logger from gcp required configuration and setup that can be normalized and abstracted away. When using cloudfunctions we want the logs to be normalized and reduce the overhead of creating and using them.

## How?

You need to have (set up authentication)[https://cloud.google.com/docs/authentication/production] for a service account permitted to read and write logs.

```javascript
import {createLogger, Logger} from "./index";

logger: Logger = createLogger(
    "my-project",  // <- gcp proiject id
    "my-cloud-function-logger"  // <- logger name
) 
    .setResourceType("cloud_function") // <- resource type
    .addLabel("eventId", context.eventId) // <- add a value to the log entry label 
    .mergeToResourceLabels({
        function_name: "my-function",
    }); // <- add a value to the log entry resource label

if (process.env.ENV === "local") {
    logger.enableConsoleLogging(); // <- will pipe logs to the console in addition to the google log explorer
}

```