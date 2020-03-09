import { createHandyClient, IHandyRedis } from "handy-redis";
import { ClientOpts } from "redis";
import { BaseDb } from "@core/db/base";
import { ServerError } from "@core/errors";

export enum PREFIX {
	NULL = "",
}

export const makeKey = (key: string, prefix: PREFIX | string = PREFIX.NULL) => {
	return prefix === "" || prefix.endsWith(":") ? ((prefix as string) += key) : ((prefix as string) += `:${key}`);
};

export class RedisDb extends BaseDb<IHandyRedis, ClientOpts> {
	public createConnection(options?: ClientOpts, makeDefault?: boolean) {
		let defaults: ClientOpts = {};
		if (options) {
			defaults = { ...defaults, ...options };
		}
		this.config = defaults;
		this.connection = createHandyClient(defaults);
		if (makeDefault) {
			RedisDb.Default = this;
		}
		return this.connection;
	}
}

export const ensureConnection = (db?: RedisDb) => {
	if (db) {
		return db.connection;
	}
	if (RedisDb.Default) {
		return (RedisDb.Default as RedisDb).connection;
	}
	throw new ServerError("Please pass a connection instance to this method or initialize redis connection");
};

type HashEntry = [string, string];

export interface RedisHash<T = Record<string, any>> {
	get<R = any>(id: keyof T): R;
}

interface HasDb {
	db?: RedisDb;
}

interface HasKey {
	key: string;
}

export interface RedisHashGetOptions extends HasDb, HasKey {
	field: string;
}

export interface RedisHashFindOptions extends HasDb, HasKey {}

export interface RedisHashClearOptions extends HasDb, HasKey {}

export interface RedisHashSaveOptions extends HasDb {
	expire?: number;
}

export class RedisHash<T = Record<string, any>> extends Map<keyof T, any> {
	public static get(options: RedisHashGetOptions) {
		const { key, field, db } = options;
		return ensureConnection(db).hget(key, field);
	}

	public static clear(options: RedisHashClearOptions) {
		const { key, db } = options;
		return ensureConnection(db).del(key);
	}

	public static find<T = Record<string, any>>(options: RedisHashFindOptions) {
		const { key, db } = options;
		return ensureConnection(db)
			.hgetall(key)
			.then((hash: Record<string, string>) => {
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

	constructor(key: string, entries?: Record<keyof T, any> | [keyof T, any][]) {
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

	public async save(options: RedisHashSaveOptions = {}) {
		const { expire, db } = options;
		const connection = ensureConnection(db);
		const entries = [...this].map(entry => {
			entry[1] = serialize(entry[1]);
			return entry as HashEntry;
		});
		const saved = await connection.hmset(this.getKey(), ...entries);
		if (saved && expire) {
			await connection.expire(this.getKey(), expire);
		}
		return saved;
	}

	public toObject() {
		return [...this].reduce((obj: any, entry) => {
			obj[entry[0]] = entry[1];
			return obj;
		}, {});
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

export interface HasPrefix {
	prefix: string;
}

export interface KeyValGetOptions extends HasDb, HasKey, Partial<HasPrefix> {}

export interface KeyValSetOptions extends HasDb, HasKey, Partial<HasPrefix> {
	value: string | any[] | object;
	ttl?: ["EX" | "PX", number] | null;
	condition?: "NX" | "XX";
}

export interface KeyValDeleteOptions extends HasDb, HasKey, Partial<HasPrefix> {}

export class KeyVal {
	public static async get(options: KeyValGetOptions) {
		const { key, prefix, db } = options;
		const data = await ensureConnection(db).get(makeKey(key, prefix));
		return data ? unserialize(data) : data;
	}

	public static delete(options: KeyValDeleteOptions) {
		const { key, prefix, db } = options;
		return ensureConnection(db).del(makeKey(key, prefix));
	}

	public static async set(options: KeyValSetOptions) {
		const { key, value, prefix, ttl, condition, db } = options;
		const connection = ensureConnection(db);
		try {
			let set = null;
			const accessor = makeKey(key, prefix);
			const val = serialize(value);
			if (ttl && condition) {
				set = await connection.set(accessor, val, ttl as any, condition);
			} else if (ttl) {
				set = await connection.set(accessor, val, ttl as any);
			} else if (condition) {
				set = await connection.set(accessor, val, condition);
			} else {
				set = await connection.set(accessor, val);
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
