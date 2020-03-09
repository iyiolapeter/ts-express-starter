import { Sequelize, SequelizeOptions, TableOptions } from "sequelize-typescript";
import { BaseDb } from "@core/db/base";

export class SequelizeDb extends BaseDb<Sequelize, SequelizeOptions> {
	public createConnection(options?: Partial<SequelizeOptions>, makeDefault?: boolean) {
		let defaults: Partial<SequelizeOptions> = {};
		if (options) {
			defaults = { ...defaults, ...options };
		}
		this.config = defaults;
		this.connection = new Sequelize(defaults);
		if (makeDefault) {
			SequelizeDb.Default = this;
		}
		return this.connection;
	}
}

export const DefaultTableOptions: TableOptions = {
	timestamps: false,
};
