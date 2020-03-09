export abstract class BaseDb<T = any, C = any> {
	public static Default: any;
	public connection!: T;

	protected config!: C;
	private self: any;

	public constructor() {
		this.self = new.target;
	}

	public initialize(options?: Partial<C>) {
		this.createConnection(options, true);
		return this;
	}

	public abstract createConnection(options?: Partial<C>, makeDefault?: boolean): T;

	public clone(options?: C, makeDefault = false) {
		const clone = new this.self() as BaseDb<T, C>;
		clone.createConnection({ ...this.config, ...options }, makeDefault);
		return clone;
	}
}
