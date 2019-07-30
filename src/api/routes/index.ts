import * as Validators from "@api/validators";
import * as Api from "@core/api";
import { noop } from "@libs/utils";
import express from "express";
import { bearerAuth } from "../middlewares";

export type RouterPathAlias = string;

export type RouteCollection = Record<string, RouterPathAlias | express.Router>;

export const routes: RouteCollection = {
	
};

export const restAuth = bearerAuth({
	strategy: ()=> ({ authorized: true }),
	excludedPaths: {
		all: [],
		get: [],
	},
});
