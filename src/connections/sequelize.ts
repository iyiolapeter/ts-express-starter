import { MySQL } from "@config";
import { Sequelize, SequelizeOptions, TableOptions } from "sequelize-typescript";
import { BaseConnection } from "./base";

export class SequelizeConnection extends BaseConnection<Sequelize, SequelizeOptions> {
	public createConnection(options?: Partial<SequelizeOptions>) {
		const defaults: Partial<SequelizeOptions> = {
			host: MySQL.HOST,
			database: MySQL.DB,
			username: MySQL.USER,
			password: MySQL.PASS,
			dialect: "mysql",
		};
		return new Sequelize({ ...defaults, ...options });
	}
}

export const defaultSequelizeConnection = new SequelizeConnection();

export const DefaultTableOptions: TableOptions = {
	timestamps: false,
};
