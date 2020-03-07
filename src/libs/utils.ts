import shortid from "shortid";
import Interpolator from "string-interpolation";
import { v4 as uuidv4} from "uuid";

export const interpolator = new Interpolator({
	delimiter: ["{{", "}}"],
});

// tslint:disable-next-line: no-empty
export const noop = (...args: any[]): any => {};

export const getNumberReference = () => {
	return new Date().valueOf();
};

export const getUniqueReference = () => {
	return uuidv4();
};

export const getShortId = () => {
	return shortid.generate();
};

export const getRandom = (digits: number) => {
	// tslint:disable-next-line: radix
	return Math.floor(Math.random() * parseInt("8" + "9".repeat(digits - 1)) + parseInt("1" + "0".repeat(digits - 1)));
};

export const verifyPhoneNumber = (phone: string) => {
	return /^([0]{1}|\+?[234]{3})([7-9]{1})([0|1]{1})([\d]{1})([\d]{7})$/g.test(phone);
};

export const sanitizePhoneNumber = (phoneNo: string, code = "234") => {
	let phone = String(phoneNo);
	const firstChar = phone.charAt(0);
	if (firstChar === "0" || firstChar === "+") {
		phone = phone.substring(1);
	}
	if (phone.substring(0, 3) === code) {
		return phone;
	}
	return code + phone;
};
