import * as Validators from "@api/validators";
import { RouteCollection, RouteLoader } from "@weaverkit/express";
import { BearerAuth } from "../middlewares";
import { App as AppConfig } from "@config";

const { fromPath, fromDefinition } = RouteLoader({
	errorHandler: AppConfig.ErrorHandler,
});

export const routes: RouteCollection = {
	docs: fromPath("@routes/docs"),
};

export const RestAuth = BearerAuth({
	strategy: () => ({ authorized: true }),
	excludedPaths: {
		all: [/^\/docs(\/?)/],
		get: [],
	},
});
