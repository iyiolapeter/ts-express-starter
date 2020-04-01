import * as Validators from "@api/validators";
import { RouteCollection, RouteLoader } from "@weaverkit/express";
import { BearerAuth } from "../middlewares";
import { App as AppConfig } from "@config";
import { Content } from "@weaverkit/data";

const { fromPath, fromDefinition } = new RouteLoader({
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
