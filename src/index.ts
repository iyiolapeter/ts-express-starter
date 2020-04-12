import Config from "@config";
import { Logger } from "@weaverkit/logger";
import http from "http";
import app from "./app";
// import { IO } from "./io";

app.set("port", Config.App.PORT);

const server = http.createServer(app);

// IO.attach(server);

const start = async () => {
	try {
		await new Promise(resolve => {
			server.listen(Config.App.PORT, () => {
				const portMessage = `Running on localhost:${Config.App.PORT}`;
				const envMessage = `Running Environment: ${Config.App.ENV}`;
				Logger.info(portMessage);
				Logger.info(envMessage);
				resolve();
			});
		});
	} catch (error) {
		Logger.error(error);
		process.exit(1);
	}
};

start();
