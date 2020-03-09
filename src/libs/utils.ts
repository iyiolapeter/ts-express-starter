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
