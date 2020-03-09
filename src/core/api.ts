import { Artifact } from "@core/artifact";
import { AppError, ServerError, ValidationError } from "@core/errors";
import { Event } from "@core/event";
import { Logger, requestTracer } from "@core/logger";
import { PathParams } from "express-serve-static-core";
import { matchedData, ValidationChain, validationResult } from "express-validator";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

export type SupportedHttpMethods = "get" | "post" | "put" | "patch" | "delete" | "head" | "trace" | "all";

export type MiddlewareSignature = (req: express.Request, res: express.Response, next?: express.NextFunction) => any;

export type SubRouter = [PathParams, express.Router];

export type RequestHandler = [PathParams, ValidationChain[] | ValidatorDefinition, MiddlewareSignature | MiddlewareSignature[], any];

export type HttpHandlers = RequestHandler[];

export interface SubRouterMount {
	use?: SubRouter[];
}

export type RouterDefinition = { [k in SupportedHttpMethods]?: HttpHandlers } & SubRouterMount;

export interface ValidatorOptions {
	onlyValidData?: boolean;
}

export interface ValidatorDefinition {
	validators: ValidationChain[];
	options?: ValidatorOptions;
}

export type RouterPathAlias = string;

export type RouteCollection = Record<string, RouterPathAlias | BaseRestApp | express.Router>;

export const isRouter = (router: any) => {
	const proto = Object.getPrototypeOf(router);
	return proto === express.Router;
};

export class ApiResponse {
	public code: number = 200;
	public message: string = "";
	public data?: any;
	constructor(data?: any, message?: string, code?: number) {
		if (data) {
			this.data = data;
		}
		if (message) {
			this.message = message;
		}
		if (code) {
			this.code = code;
		}
	}
}

export const validateRequest = (req: express.Request, options: Partial<ValidatorOptions> = {}) => {
	const errorFormatter = ({ msg, param }: any) => {
		return {
			parameter: param,
			message: msg,
		};
	};
	const errors = validationResult(req).formatWith(errorFormatter);
	if (!errors.isEmpty()) {
		throw new ValidationError().setData({ validation_failed: true, errors: errors.array({ onlyFirstError: true }) });
	}
	const data = matchedData(req, {
		onlyValidData: options.onlyValidData || true,
	});
	Logger.info("Request Validated Data ", data);
	return data;
};

export const restFacade = (requestHandler: (req: any, res: any, next?: any) => void) => {
	const wrapped = async (req: express.Request, res: express.Response, next: any) => {
		try {
			await requestHandler(req, res, next);
		} catch (caught) {
			const error = caught instanceof AppError ? caught : new ServerError(caught);
			error.setClient((req as any).client || {});
			if (!res.headersSent) {
				res.status(error.httpCode).json(new ApiResponse(error.data, error.message, error.httpCode));
			}
			Logger.error("BUBBLED ERROR: ", caught);
			if (error.reportable) {
				//
			}
		}
	};
	return wrapped;
};

const defaultRequestHandler = (controllerFn: any, options: Partial<ValidatorOptions> = {}) => {
	const defaultOptions: Partial<ValidatorOptions> = {
		onlyValidData: true,
	};
	const handler = async (req: express.Request, res: express.Response) => {
		try {
			const data = validateRequest(req, { ...defaultOptions, ...options });
			const result = await controllerFn(data, (req as any).client);
			if (result instanceof Artifact) {
				const response = new ApiResponse(result.data, result.message || "Request successful");
				res.status(response.code).json(response);
			} else {
				const response = new ApiResponse(result, "Request successful");
				res.status(response.code).json(response);
			}
		} catch (error) {
			throw error;
		}
	};
	return handler;
};

export const load = (definition: RouterDefinition) => {
	const router = express.Router();
	for (const [method, routes] of Object.entries(definition)) {
		for (const route of routes as Required<HttpHandlers>) {
			if (method === "use") {
				router.use(route[0], (route[1] as unknown) as express.Router);
			} else {
				let options = {};
				const [path, validators, middlewares, controller] = route as RequestHandler;
				const handlers: (MiddlewareSignature | ValidationChain)[] = [];
				if (Array.isArray(middlewares)) {
					handlers.push(...middlewares);
				} else {
					handlers.push(middlewares);
				}
				if (Array.isArray(validators)) {
					handlers.push(...validators);
				} else {
					handlers.push(...validators.validators);
					options = validators.options || {};
				}
				handlers.push(restFacade(defaultRequestHandler(controller, options)));
				(router as any)[method](path, handlers);
			}
		}
	}
	return router;
};

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

export class BaseRestApp {
	public app!: express.Application;

	constructor(app?: express.Application) {
		if (app) {
			this.app = app;
		}
	}
}

export class RestApp extends BaseRestApp {
	constructor(private routes: RouteCollection = {}) {
		super();
		this.app = express();
		this.init();
	}

	private init() {
		Event.emit("restapp:preinit", this);
		this.app.use(cors());
		this.app.use(requestTracer());
		this.app.use(helmet());
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));
		Event.emit("restapp:init", this);
		this.bindRoutes();
	}

	private bindRoutes() {
		Event.emit("restapp:routes:beforebind", this);
		for (const [route, loc] of Object.entries(this.routes)) {
			const router: express.Router | false = isRouter(loc) ? (loc as express.Router) : loadRouter(loc as string);
			if (router) {
				this.app.use(`/${route}`, router as express.Router);
			}
		}
		Event.emit("restapp:routes:afterbind", this);
	}
}
