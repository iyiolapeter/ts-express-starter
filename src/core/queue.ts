import Redis from "@connections/redis";
import { Logger } from "@core/logger";
import { createQueue as factory, Job, ProcessCallback, Queue } from "kue";

export const createQueue = () => {
	return factory({
		redis: {
			createClientFactory: () => {
				return Redis.createConnection().redis;
			},
		},
		prefix: `queue`,
	});
};

// The following order must be left as is compulsorily for queue to be initialized properly and work correctly
export const queue = createQueue();
export { app, ProcessCallback as JobProcessor, Job, WorkerCtx, DoneCallback } from "kue";

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
	type: string;
	concurrency?: number;
}

export class Worker {
	public concurrency: number;
	private canProcess: boolean = false;
	private processor!: ProcessCallback;
	private queue: Queue;

	private readonly type: string;

	constructor({ type, concurrency = 10 }: WorkerOptions) {
		this.type = type;
		this.concurrency = concurrency;
		this.queue = createQueue();
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
