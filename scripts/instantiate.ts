import { SecretNetworkClient, Wallet } from "secretjs";
import dotenv from "dotenv";
import { writeToEnv } from './write2env.js';

dotenv.config();

let wallet: Wallet;
let chainId: string;
let lcdUrl: string;
let codeId: string;
let contractCodeHash: string;

const network_config = process.env.NETWORK!;

if (network_config == "0") {// localnet
	chainId = process.env.CHAIN_ID_LOCALNET!;
	lcdUrl = process.env.LCD_URL_LOCALNET!;
	wallet = new Wallet(process.env.MNEMONIC_LOCALNET!);
	codeId = process.env.CODE_ID_LOCALNET!;
	contractCodeHash = process.env.CONTRACT_CODE_HASH_LOCALNET!;
} else {// testnet
	chainId = process.env.CHAIN_ID_TESTNET!;
	lcdUrl = process.env.LCD_URL_TESTNET!;
	wallet = new Wallet(process.env.MNEMONIC_TESTNET!);
	codeId = process.env.CODE_ID_TESTNET!;
	contractCodeHash = process.env.CONTRACT_CODE_HASH_TESTNET!;
}

const secretjs = new SecretNetworkClient({
	chainId: chainId!,
	url: lcdUrl!,
	wallet: wallet!,
	walletAddress: wallet!.address,
});

console.log(secretjs);
console.log("codeId = " + codeId);
console.log("code hash = " + contractCodeHash);

let contractAddress: string;
// instantiate the contract
let instantiate_contract = async (participationFeeUscrt: string) => {
	// Create an instance of the Counter contract, providing a starting count
	const initMsg: { participation_fee_uscrt: string } = { participation_fee_uscrt: participationFeeUscrt };
	let tx = await secretjs.tx.compute.instantiateContract(
		{
			code_id: codeId,
			sender: wallet.address,
			code_hash: contractCodeHash,
			init_msg: initMsg,
			label: `CTR${Math.ceil(Math.random() * 10000)}`,
		},
		{
			gasLimit: 400_000,
		}
	);
	//console.dir(tx , { depth: null }); // IMPORTANT FOR DEBUGGING

	contractAddress = tx.arrayLog!.find(
		(log) => log.type === "message" && log.key === "contract_address"
	)!.value;

	console.log("contract address: " + contractAddress);

	console.log("writing to .env's...")
	const scriptsEnvPath = ".env";
	const PathVariablePrefixesMap = [
		{ envPathPrefix: '../', envVarPrefix: '' },
		{ envPathPrefix: '../scrt_lottery_react_app/', envVarPrefix: 'REACT_APP_' },
		{ envPathPrefix: '../tests/', envVarPrefix: '' },
	];

	PathVariablePrefixesMap.forEach(({ envPathPrefix, envVarPrefix }) => {
		if (network_config == "0") {//localnet
			writeToEnv(envPathPrefix + scriptsEnvPath, envVarPrefix + "CONTRACT_ADDRESS_LOCALNET", contractAddress.toString());
		} else if (network_config == "1") {//testnet
			writeToEnv(envPathPrefix + scriptsEnvPath, envVarPrefix + "CONTRACT_ADDRESS_TESTNET", contractAddress.toString());
		}
	});
	console.log("writing to .env's done.")
};

await instantiate_contract("500000");

