import { MySQL, App } from "@config";
import { RedisDb } from "@core/db/redis";
import { SequelizeDb } from "@core/db/sequelize";
import { KueDb } from "@core/db/kue";

const Redis = new RedisDb().initialize({
	prefix: `${App.NAME}:${App.ENV}:`,
	db: 2,
});

const MySql = new SequelizeDb().initialize({
	host: MySQL.HOST,
	database: MySQL.DB,
	username: MySQL.USER,
	password: MySQL.PASS,
	dialect: "mysql",
});

const connections = {
	Redis,
	MySql,
	queue: new KueDb().initialize({
		redis: {
			createClientFactory: () => {
				return Redis.clone().connection.redis;
			},
		},
		prefix: `queue`,
	}),
};

export = connections;
