import { SecretNetworkClient } from "secretjs";
import dotenv from "dotenv";

dotenv.config();

let chainId: string;
let lcdUrl: string;
let contractCodeHash: string;
let contractAddress: string;

const network_config = process.env.NETWORK!;

if (network_config == "0") {// localnet
	chainId = process.env.CHAIN_ID_LOCALNET!;
	lcdUrl = process.env.LCD_URL_LOCALNET!;
	contractCodeHash = process.env.CONTRACT_CODE_HASH_LOCALNET!;
	contractAddress = process.env.CONTRACT_ADDRESS_LOCALNET!;
} else {// testnet
	chainId = process.env.CHAIN_ID_TESTNET!;
	lcdUrl = process.env.LCD_URL_TESTNET!;
	contractCodeHash = process.env.CONTRACT_CODE_HASH_TESTNET!;
	contractAddress = process.env.CONTRACT_ADDRESS_TESTNET!;
}

const queryOwner = async (): Promise<string> => {
	const readOnlySecretjs = new SecretNetworkClient({
		url: lcdUrl,
		chainId: chainId,
	});
	//console.dir(readOnlySecretjs, { depth: null });
	type OwnerResponse = { owner: string };
	let response: OwnerResponse;
	try {
		response = await readOnlySecretjs.query.compute.queryContract({
			contract_address: contractAddress,
			code_hash: contractCodeHash,
			query: { get_owner: {} },
		}) as OwnerResponse;
	} catch (e) {
		console.log(`error quering owner: query contract error`);
		return "";
	}
	if ('err"' in response!) {
		console.log(`error quering owner: ${response}`);
		return "";
	}
	console.log("queried smart contract: ", response!);
	console.log("owner is: " + response!.owner)
	return response!.owner;
};

await queryOwner();

