import { Event } from "@core/event";
import { RestApp } from "@core/api";
import { RestAuth, AppRoutes } from "@api/routes";
import { LogStream, Logger } from "@core/logger";
import { queue } from "@connections/index";
import express from "express";
import morgan = require("morgan");
import path from "path";

Event.once("restapp:init", (sender: RestApp) => {
	Logger.info("App init called");
	sender.app.use(
		morgan("combined", {
			stream: LogStream,
			skip: req => {
				return req.originalUrl.startsWith("/queue");
			},
		}),
	);
	sender.app.use("/assets", express.static(path.join(__dirname, "./../assets")));
	sender.app.use(RestAuth);
});

Event.once("restapp:routes:afterbind", (sender: RestApp) => {
	Logger.info("App routes after bind called");
	sender.app.use(`/queue`, queue.app());
});

export default new RestApp(AppRoutes).app;
