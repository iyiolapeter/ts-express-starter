import mongoose, { Connection, SchemaOptions, ConnectionOptions } from "mongoose";
import { BaseDb } from "./base";

export const DEFAULT_SCHEMA_OPTIONS: SchemaOptions = {
	timestamps: true,
};

export class MongooseDb extends BaseDb<Connection, ConnectionOptions> {
	public constructor(public uri: string) {
		super();
	}

	public createConnection(options?: ConnectionOptions, makeDefault?: boolean) {
		let defaults: ConnectionOptions = {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
		};
		if (options) {
			defaults = { ...defaults, ...options };
		}
		this.config = defaults;
		this.connection = mongoose.createConnection(this.uri, defaults);
		if (makeDefault) {
			MongooseDb.Default = this;
		}
		return this.connection;
	}
}
