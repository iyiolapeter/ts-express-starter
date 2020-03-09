import * as Validators from "@api/validators";
import * as Api from "@core/api";
import { noop } from "@core/utils";
import { BearerAuth } from "../middlewares";

export const AppRoutes: Api.RouteCollection = {};

export const RestAuth = BearerAuth({
	strategy: () => ({ authorized: true }),
	excludedPaths: {
		all: [],
		get: [],
	},
});
