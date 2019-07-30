import { restAuth, RouteCollection, routes } from "@api/routes";
import { isRouter } from "@core/api";
import { LogStream, requestTracer } from "@core/logger";
import { app as KueApp } from "@core/queue";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan = require("morgan");
import path from "path";

const loadRouter = (modulePath: string) => {
	try {
		const router = require(modulePath);
		if (isRouter(router)) {
			return router as express.Router;
		}
		return false;
	} catch (error) {
		throw error;
	}
};

class RestApp {
	public app: express.Application;

	constructor(private routeDefs: RouteCollection = {}) {
		this.app = express();
		this.init();
	}

	private init() {
		this.app.use(cors());
		this.app.use(requestTracer());
		this.app.use(
			morgan("combined", {
				stream: LogStream,
				skip: req => {
					return req.originalUrl.startsWith("/queue");
				},
			}),
		);
		this.app.use(helmet());
		this.app.use("/assets", express.static(path.join(__dirname, "./../assets")));
		this.app.use(restAuth);
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.bindRoutes();
	}

	private bindRoutes() {
		for (const [route, loc] of Object.entries(this.routeDefs)) {
			const router: express.Router | false = isRouter(loc) ? (loc as express.Router) : loadRouter(loc as string);
			if (router) {
				this.app.use(`/${route}`, router as express.Router);
			}
		}
		this.app.use(`/queue`, KueApp);
	}
}

export default new RestApp(routes).app;
