import { SupportedHttpMethods } from "@weaverkit/express";
import express from "express";

interface AuthStrategyResponse {
	authorized: boolean;
	message?: string;
	code?: number;
	[key: string]: any;
}

type ExcludedPath = { [k in SupportedHttpMethods]?: RegExp[] } | RegExp[];

interface AuthOptions {
	headerKey?: string;
	excludedPaths?: ExcludedPath;
	strategy: (token: string, ctx?: express.Request) => AuthStrategyResponse | Promise<AuthStrategyResponse>;
}
export const BearerAuth = ({ headerKey = "Bearer", excludedPaths = [], strategy }: AuthOptions) => {
	return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
		const runExclusions = (path: string, list: RegExp[]) => {
			for (const exp of list) {
				if (exp.test(path)) {
					return true;
				}
			}
			return false;
		};
		const excluded = (rq: express.Request, list: ExcludedPath) => {
			if (Array.isArray(list)) {
				return runExclusions(rq.path, list);
			} else if (typeof list === "object") {
				let ex = false;
				if (Array.isArray((list as any)[rq.method.toLowerCase()])) {
					ex = runExclusions(rq.path, (list as any)[rq.method.toLowerCase()]);
				}
				if (!ex && Array.isArray(list.all)) {
					ex = runExclusions(rq.path, list.all);
				}
				return ex;
			}
			return false;
		};
		if (excluded(req, excludedPaths)) {
			next();
		} else if (!req.headers.authorization) {
			res.status(401).json({ code: 401, message: "Missing Authorization Key" });
		} else {
			const parts = (req.headers.authorization as string).split(" ");
			if (parts.length !== 2 || parts[0] !== headerKey) {
				next();
			}
			const token = parts[1].trim();
			try {
				const state = await strategy(token, req);
				if (state.authorized === true) {
					return next();
				}
				return res.status(state.code || 401).json(state);
			} catch (error) {
				return res.status(500).json({ message: "Strategy Error" });
			}
		}
	};
};
