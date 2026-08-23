import { randomInt } from "node:crypto";

class OtpGenerator {
	static generate() {
		return String(randomInt(100000, 1000000));
	}
}

const generateOtp = () => OtpGenerator.generate();

export { OtpGenerator, generateOtp };
