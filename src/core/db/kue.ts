import { Logger } from "@core/logger";
import { createQueue, Job, ProcessCallback, Queue, app } from "kue";
import { BaseDb } from "./base";

export { ProcessCallback as JobProcessor, Job, WorkerCtx, DoneCallback } from "kue";

export class KueDb extends BaseDb<Queue, Record<string, any>> {
	public createConnection(options?: Record<string, any>, makeDefault?: boolean) {
		let defaults: Record<string, any> = {};
		if (options) {
			defaults = { ...defaults, ...options };
		}
		this.config = defaults;
		this.connection = createQueue(defaults);
		if (makeDefault) {
			KueDb.Default = this;
		}
		return this.connection;
	}

	public app() {
		return app;
	}
}

export const composeJobLogger = (job: Job) => {
	return (message: string, isError = false) => {
		message = `JOB ID ${job.id} ===> ` + message;
		isError ? Logger.error(message) : Logger.info(message);
		job.log.apply(job, [message]);
	};
};

export const saveJob = (job: Job) => {
	return new Promise<boolean>((resolve, reject) => {
		job.save((err: any) => {
			if (err) {
				reject(err);
			} else {
				resolve(true);
			}
		});
	});
};

interface WorkerOptions {
	queue: Queue;
	type: string;
	concurrency?: number;
}

export class Worker {
	public concurrency: number;
	private processor!: ProcessCallback;
	private queue: Queue;

	private readonly type: string;

	constructor({ queue, type, concurrency = 10 }: WorkerOptions) {
		this.type = type;
		this.concurrency = concurrency;
		this.queue = queue;
	}

	public getType() {
		return this.type;
	}

	public bindProcessor(processor: ProcessCallback) {
		if (typeof processor === "function") {
			this.processor = processor;
			return this;
		}
		throw new Error("Processor is not a function");
	}

	public start() {
		Logger.info("Worker Started...", { type: this.type, concurrency: this.concurrency });
		this.queue.process(this.type, this.concurrency, this.processor);
	}
}
