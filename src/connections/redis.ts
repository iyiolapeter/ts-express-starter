import { App } from "@config";
import { createHandyClient, IHandyRedis } from "handy-redis";
import { ClientOpts } from "redis";
import { BaseConnection } from "./base";

export enum PREFIX {
	NULL = ""
}

export const makeKey = (key: string, prefix: PREFIX | string = PREFIX.NULL) => {
	return prefix === "" || prefix.endsWith(":") ? ((prefix as string) += key) : ((prefix as string) += `:${key}`);
};

class RedisConnection extends BaseConnection<IHandyRedis, ClientOpts> {
	public createConnection(options?: ClientOpts) {
		let defaults: ClientOpts = {
			prefix: `${App.NAME}:${App.ENV}:`,
			db: 2,
		};
		if (options) {
			defaults = { ...defaults, ...options };
		}
		return createHandyClient(defaults);
	}
}

const Redis = new RedisConnection();

type HashEntry = [string, string];
type RedisAccessor = [string, (PREFIX | string)?];

export interface RedisHash<T = Record<string, any>> {
	get<R = any>(id: keyof T): R;
}
export class RedisHash<T = Record<string, any>> extends Map<keyof T, any> {
	public static get(key: string, field: string) {
		return Redis.ActiveConnection.hget(key, field);
	}

	public static clear(key: string) {
		return Redis.ActiveConnection.del(key);
	}

	public static find<T = Record<string, any>>(key: string) {
		return Redis.ActiveConnection.hgetall(key).then((hash: Record<string, string>) => {
			if (!hash) {
				return null;
			}
			const unwrapped = Object.entries(hash).map(entry => {
				entry[1] = unserialize(entry[1]);
				return entry;
			});
			return new RedisHash<T>(key, unwrapped as any);
		});
	}

	// tslint:disable-next-line: variable-name
	private __key: string;

	constructor(key: string, entries?: Record<keyof T, any> | Array<[keyof T, any]>) {
		if (Array.isArray(entries) || entries === undefined) {
			super(entries);
		} else if (typeof entries === "object") {
			super(Object.entries(entries) as any);
		} else {
			throw new Error("Unknown Hash construction");
		}
		this.__key = key;
	}

	public getKey() {
		return this.__key;
	}

	public save() {
		const entries = [...this].map(entry => {
			entry[1] = serialize(entry[1]);
			return entry as HashEntry;
		});
		return Redis.ActiveConnection.hmset(this.getKey(), ...entries);
	}
}

const serialize = (data: string | any[] | object) => {
	if (typeof data === "string" || typeof data === "number") {
		return String(data);
	} else if (Array.isArray(data) || typeof data === "object") {
		return JSON.stringify(data);
	} else {
		throw new Error("Failed to serialize data with unsupported type " + typeof data);
	}
};

const unserialize = (data: string) => {
	try {
		return isNaN(Number(data)) ? JSON.parse(data) : data;
	} catch (error) {
		return data;
	}
};

export class KeyVal {
	public static async get([key, prefix = PREFIX.NULL]: RedisAccessor) {
		const data = await Redis.ActiveConnection.get(makeKey(key, prefix));
		return data ? unserialize(data) : data;
	}

	public static delete([key, prefix = PREFIX.NULL]: RedisAccessor) {
		return Redis.ActiveConnection.del(makeKey(key, prefix));
	}

	public static async set(
		[key, prefix = PREFIX.NULL]: RedisAccessor,
		value: string | any[] | object,
		ttl?: ["EX" | "PX", number] | null,
		condition?: "NX" | "XX",
	) {
		try {
			let set = null;
			const accessor = makeKey(key, prefix);
			const val = serialize(value);
			if (ttl && condition) {
				set = await Redis.ActiveConnection.set(accessor, val, ttl as any, condition);
			} else if (ttl) {
				set = await Redis.ActiveConnection.set(accessor, val, ttl as any);
			} else if (condition) {
				set = await Redis.ActiveConnection.set(accessor, val, condition);
			} else {
				set = await Redis.ActiveConnection.set(accessor, val);
			}
			if (set) {
				return true;
			}
			return false;
		} catch (error) {
			return false;
		}
	}
}

export default Redis;
