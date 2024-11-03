const USCRT_PER_SCRT = 1_000_000;

const convertUscrtToScrt = (uscrtString: string): number => {
	try {
		if (!/^\d+$/.test(uscrtString)) {
			throw new Error(`Invalid input for uscrt: ${uscrtString}`);
		}
		const uscrtValue = BigInt(uscrtString);
		const scrtValue = Number(uscrtValue) / USCRT_PER_SCRT;
		return scrtValue;
	} catch (error) {
		console.error("Error converting uSCRT to SCRT:", error);
		return 0; //  default value
	}
};

const convertScrtToUscrt = (scrtValue: number): string => {
	try {
		if (isNaN(scrtValue) || scrtValue < 0) {
			throw new Error(`Invalid input for SCRT: ${scrtValue}`);
		}
		const uscrtValue = BigInt(scrtValue * USCRT_PER_SCRT);
		return uscrtValue.toString();
	} catch (error) {
		console.error("Error converting SCRT to uSCRT:", error);
		return "0"; // default value
	}
};

export { convertUscrtToScrt, convertScrtToUscrt };

