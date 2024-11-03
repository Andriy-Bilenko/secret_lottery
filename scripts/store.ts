import { SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
import dotenv from "dotenv";
import { writeToEnv } from './write2env.js';

dotenv.config();

let wallet: Wallet;
let chainId: string;
let lcdUrl: string;
const network_config = process.env.NETWORK!;
console.log("network: " + network_config);

if (network_config == "0") {// localnet
	chainId = process.env.CHAIN_ID_LOCALNET!;
	lcdUrl = process.env.LCD_URL_LOCALNET!;
	wallet = new Wallet(process.env.MNEMONIC_LOCALNET!);
} else {// testnet
	chainId = process.env.CHAIN_ID_TESTNET!;
	lcdUrl = process.env.LCD_URL_TESTNET!;
	wallet = new Wallet(process.env.MNEMONIC_TESTNET!);
};
//console.dir(wallet, { depth: null });
//console.dir(chainId, { depth: null });
//console.dir(lcdUrl, { depth: null });

const contract_wasm = fs.readFileSync("contract.wasm.gz");

const secretjs = new SecretNetworkClient({
	chainId: chainId!,
	url: lcdUrl!,
	wallet: wallet!,
	walletAddress: wallet!.address,
});

//console.log(secretjs);

let codeId: string;
let contractCodeHash: string;

let upload_contract = async () => {
	let tx = await secretjs.tx.compute.storeCode(
		{
			sender: wallet!.address,
			wasm_byte_code: contract_wasm,
			source: "",
			builder: "",
		},
		{
			gasLimit: 10_000_000,
		}
	);
	//console.dir(tx, { depth: null }); // IMPORTANT FOR DEBUGGING
	//console.log("rawlog: " + tx.rawLog)
	codeId = Number(
		tx.arrayLog!.find((log) => log.type === "message" && log.key === "code_id")!
			.value,
	).toString();
	console.log("codeId: ", codeId);
	contractCodeHash = (
		await secretjs.query.compute.codeHashByCodeId({ code_id: codeId })
	).code_hash!;
	console.log(`Contract hash: ${contractCodeHash}`);

	console.log("writing to .env's...")
	const scriptsEnvPath = ".env";
	const PathVariablePrefixesMap = [
		{ envPathPrefix: '../', envVarPrefix: '' },
		{ envPathPrefix: '../scrt_lottery_react_app/', envVarPrefix: 'REACT_APP_' },
		{ envPathPrefix: '../tests/', envVarPrefix: '' },
	];

	PathVariablePrefixesMap.forEach(({ envPathPrefix, envVarPrefix }) => {
		if (network_config == "0") {//localnet
			writeToEnv(envPathPrefix + scriptsEnvPath, envVarPrefix + "CODE_ID_LOCALNET", codeId.toString());
			writeToEnv(envPathPrefix + scriptsEnvPath, envVarPrefix + "CONTRACT_CODE_HASH_LOCALNET", contractCodeHash.toString());
		} else if (network_config == "1") {//testnet
			writeToEnv(envPathPrefix + scriptsEnvPath, envVarPrefix + "CODE_ID_TESTNET", codeId.toString());
			writeToEnv(envPathPrefix + scriptsEnvPath, envVarPrefix + "CONTRACT_CODE_HASH_TESTNET", contractCodeHash.toString());
		}
	});
	console.log("writing to .env's done.")
};

await upload_contract();



