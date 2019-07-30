import { verifyPhoneNumber } from "@libs/utils";

describe("Utils Library", () => {
	it("should verify valid phoneNumber", () => {
		expect(verifyPhoneNumber("2348139104625")).toBe(true);
		expect(verifyPhoneNumber("23481391046256")).toBe(false);
	});
});
