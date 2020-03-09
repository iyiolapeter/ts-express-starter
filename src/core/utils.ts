import shortid from "shortid";
import Interpolator from "string-interpolation";
import { v4 as uuidv4 } from "uuid";

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
