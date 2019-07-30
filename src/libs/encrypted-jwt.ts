import crypto from "crypto";
import jwt from "jsonwebtoken";
export * from "jsonwebtoken";

const encrypt = (token: string, encryptionKey: string) => {
	const cipher = crypto.createCipher("aes-256-cbc", encryptionKey);
	return cipher.update(token, "utf8", "hex") + cipher.final("hex");
	// return token;
};

const decrypt = (token: string, encryptionKey: string) => {
	const decipher = crypto.createDecipher("aes-256-cbc", encryptionKey);
	return decipher.update(token, "hex", "utf8") + decipher.final("utf8");
	// return token;
};

export class EJWT {
	public static decode(token: string, encryptionKey: string, options?: jwt.DecodeOptions) {
		return jwt.decode(decrypt(token, encryptionKey), options);
	}

	public static sign(payload: string | object | Buffer, encryptionKey: string, secretKey: jwt.Secret, options?: jwt.SignOptions) {
		return encrypt(jwt.sign(payload, secretKey, options), encryptionKey);
	}

	public static verify(token: string, encryptionKey: string, secretKey: string | Buffer, options?: jwt.VerifyOptions) {
		return jwt.verify(decrypt(token, encryptionKey), secretKey, options);
	}
}
