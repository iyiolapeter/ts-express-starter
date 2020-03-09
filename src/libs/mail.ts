import nodemailer, { SendMailOptions } from "nodemailer";
import { Address } from "nodemailer/lib/mailer";

export interface EmailSource {
	from: Address;
	config: {
		host: string;
		port: number;
		secure: boolean;
		auth: {
			user: string;
			pass: string;
		};
	};
}

export const send = async (config: any, message: SendMailOptions) => {
	try {
		if (!message) {
			throw new Error("Message object is not set");
		}
		const transport = nodemailer.createTransport(config, {});
		await transport.verify();
		const info = await transport.sendMail(message);
		return info;
	} catch (error) {
		return Promise.reject(error);
	}
};

interface MailOptions {
	source?: EmailSource;
	to: (string | Address)[];
	subject?: string;
	text?: string;
	html?: string;
	attachments?: any[];
}

export class Mail {
	public static DEFAULT_SOURCE?: EmailSource;

	constructor(private options: MailOptions = { to: [] }) {}

	public to(to: string | Address | (string | Address)[], append: boolean = true) {
		if (Array.isArray(to)) {
			append ? this.options.to.push(...to) : (this.options.to = to);
		} else {
			append ? this.options.to.push(to) : (this.options.to = [to]);
		}
		return this;
	}

	public subject(subject: string) {
		this.options.subject = subject;
		return this;
	}

	public text(text: string) {
		this.options.text = text;
		return this;
	}

	public html(html: string) {
		this.options.html = html;
		return this;
	}

	public attachments(attachments: any) {
		this.options.attachments = attachments;
		return this;
	}

	public send(source?: EmailSource) {
		if (source) {
			this.options.source = source;
		}
		if (!this.options.source && !source && Mail.DEFAULT_SOURCE) {
			this.options.source = Mail.DEFAULT_SOURCE;
		} else {
			throw new Error("No source specified and no default to fall back to");
		}
		if (!this.options.to || !this.options.subject) {
			throw new Error("Message not fully configured. Make sure to and subject are set");
		}
		if (!this.options.text && !this.options.html) {
			throw new Error("Message not fully configured. HTML or Text must be set");
		}
		const { source: sc, ...message } = this.options;
		(message as SendMailOptions).from = sc.from;
		return send(sc.config, message);
	}
}
