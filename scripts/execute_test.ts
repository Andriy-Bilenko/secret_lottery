import { SecretNetworkClient, Wallet, MsgExecuteContract } from "secretjs";
import dotenv from "dotenv";

dotenv.config();

let wallet: Wallet;
let chainId: string;
let lcdUrl: string;
let codeId: string;
let contractCodeHash: string;
let contractAddress: string;

const network_config = process.env.NETWORK!;

if (network_config == "0") {// localnet
	chainId = process.env.CHAIN_ID_LOCALNET!;
	lcdUrl = process.env.LCD_URL_LOCALNET!;
	wallet = new Wallet(process.env.MNEMONIC_LOCALNET!);
	codeId = process.env.CODE_ID_LOCALNET!;
	contractCodeHash = process.env.CONTRACT_CODE_HASH_LOCALNET!;
	contractAddress = process.env.CONTRACT_ADDRESS_LOCALNET!;
} else {// testnet
	chainId = process.env.CHAIN_ID_TESTNET!;
	lcdUrl = process.env.LCD_URL_TESTNET!;
	wallet = new Wallet(process.env.MNEMONIC_TESTNET!);
	codeId = process.env.CODE_ID_TESTNET!;
	contractCodeHash = process.env.CONTRACT_CODE_HASH_TESTNET!;
	contractAddress = process.env.CONTRACT_ADDRESS_TESTNET!;
}

const secretjs = new SecretNetworkClient({
	chainId: chainId!,
	url: lcdUrl!,
	wallet: wallet!,
	walletAddress: wallet!.address,
});

//console.log(secretjs);
console.log("codeId = " + codeId);
console.log("code hash = " + contractCodeHash);

const handleParticipate = async () => {
	// Create the participation message
	const participationMsg = new MsgExecuteContract({
		sender: secretjs!.address,
		contract_address: contractAddress,
		code_hash: contractCodeHash,
		msg: { participate: {} }, // The message to send to the contract
		sent_funds: [{ amount: "500000", denom: "uscrt" }], // Correct property name for funds
	});

	console.log("Participation Message:", participationMsg);

	try {
		// Broadcast the participation message
		const tx = await secretjs!.tx.broadcast([participationMsg], {
			gasLimit: 200_000, // Specify the gas limit
		});

		if (tx.rawLog.toLowerCase().includes("error")) {
			console.error(`Query failed with the following err: ${JSON.stringify(tx)}`)
			return
		}

		console.log("Transaction Response:", tx);
		console.error("Participation successful!");
	} catch (error) {
		console.error("Error during participation:", error);
		console.error("Participation failed. Please check the console for more details.");
	}
};

await handleParticipate();

