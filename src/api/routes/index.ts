import * as Validators from "@api/validators";
import * as Api from "@core/api";
import { BearerAuth } from "../middlewares";

export const AppRoutes: Api.RouteCollection = {
	docs: "@routes/docs",
};

export const RestAuth = BearerAuth({
	strategy: () => ({ authorized: true }),
	excludedPaths: {
		all: [/^\/docs(\/?)/],
		get: [],
	},
});
