import ejs from "ejs";
import path from "path";

export class Artifact {
	public message: string | null = null;
	public data: object | null;

	constructor(data: object | null = null, message?: string) {
		this.data = data;
		if (message) {
			this.message = message;
		}
	}
}

export interface Layout {
	name: string;
	params?: Record<string, any>;
	contentVar?: string;
}

export class Content {
	public static ext = ".ejs";
	public static viewPath: string = path.resolve(__dirname, "../../views");

	public static path(view: string) {
		if (view.endsWith("/")) {
			view += "index.ejs";
		}
		if (!view.startsWith("//") && view.startsWith("/")) {
			view = view.substring(1);
		}
		return path.resolve(this.viewPath, `${view}${view.endsWith(this.ext) ? "" : this.ext}`);
	}

	constructor(public view: string, public params: Record<string, any> = {}, public layout?: Layout) {}

	public async render() {
		const view = (this.constructor as any).path(this.view);
		if (!this.layout) {
			return await ejs.renderFile(view, this.params);
		}
		const layoutFile = (this.constructor as any).path(`layouts/${this.layout.name}`);
		const content = this.layout.contentVar || "content";
		if (!this.layout.params) {
			this.layout.params = {};
		}
		this.params.layout = this.layout.params;
		this.params.layout[content] = view;
		return ejs.renderFile(layoutFile, this.params, {
			debug: false,
		});
	}
}
