import { EventEmitter } from "events";
import { AppError, ServerError } from "@core/errors";
import { Logger } from "@core/logger";

class AppEvent extends EventEmitter {}

export const Event = new AppEvent();
Event.on("error", caught => {
	const error = caught instanceof AppError ? caught : new ServerError(caught);
	Logger.error(error);
});
