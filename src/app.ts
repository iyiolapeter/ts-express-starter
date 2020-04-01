import { WeaverExpressApp, WeaverExpressAppEvents } from "@weaverkit/express";
import { RestAuth, routes } from "@api/routes";
import { LogStream, Logger, createContextId } from "@weaverkit/logger";
import express, { Application, NextFunction, Request, Response } from "express";
import morgan from "morgan";
import path from "path";
import Config from "@config";

const WeaverApp = new WeaverExpressApp({
	routes,
	errorHandler: Config.App.ErrorHandler,
});

WeaverApp.on(WeaverExpressAppEvents.PREINIT, (app: Application) => {
	Logger.info("App init called");
	app.use((req: Request, res: Response, next: NextFunction) => {
		createContextId((error: Error | null, contextId: string | false) => {
			if (contextId) {
				res.set("X-Context-Id", contextId);
			}
			next();
		});
	});
	app.use(
		morgan("combined", {
			stream: LogStream,
			skip: req => {
				return req.originalUrl.startsWith("/queue");
			},
		}),
	);
	app.use("/assets", express.static(path.join(__dirname, "./../assets")));
	app.use(RestAuth);
});

WeaverApp.once(WeaverExpressAppEvents.ROUTES_DID_BIND, (app: Application) => {
	Logger.info("App routes have been mounted");
	// Do stuff
});

WeaverApp.init();

export default (WeaverApp as any).app;
