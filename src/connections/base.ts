export abstract class BaseConnection<T = any, C = any> {
	public ActiveConnection!: T;

	constructor() {
		this.ActiveConnection = this.createConnection();
		this.initialize();
	}

	public initialize() {
		return;
	}

	public abstract createConnection(options?: C): T;

	public getConnection(fresh: boolean = false) {
		if (this.ActiveConnection && !fresh) {
			return this.ActiveConnection;
		}
		return this.createConnection();
	}
}
