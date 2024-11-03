import { SecretNetworkClient, MsgExecuteContract, Wallet } from "secretjs";
import { OfflineAminoSigner, Window as KeplrWindow } from "@keplr-wallet/types";
import { convertScrtToUscrt, convertUscrtToScrt } from "../utils/SecretNetworkLotteryHelpers";

declare global {
	interface Window extends KeplrWindow { }
}

// localnet
let wallet: Wallet | undefined;
// testnet
let signer: OfflineAminoSigner | undefined;
//both
let chainId: string;
let lcdUrl: string;
let codeId: string;
let contractAddress: string;
let contractCodeHash: string;

const network_config = process.env.REACT_APP_NETWORK!;
//console.log("network: " + network_config);

let secretjs: SecretNetworkClient | undefined;

if (network_config == "0") {// localnet
	chainId = process.env.REACT_APP_CHAIN_ID_LOCALNET!;
	lcdUrl = process.env.REACT_APP_LCD_URL_LOCALNET!;
	codeId = process.env.REACT_APP_CODE_ID_LOCALNET!;
	contractCodeHash = process.env.REACT_APP_CONTRACT_CODE_HASH_LOCALNET!;
	contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS_LOCALNET!;
} else {// testnet
	chainId = process.env.REACT_APP_CHAIN_ID_TESTNET!;
	lcdUrl = process.env.REACT_APP_LCD_URL_TESTNET!;
	codeId = process.env.REACT_APP_CODE_ID_TESTNET!;
	contractCodeHash = process.env.REACT_APP_CONTRACT_CODE_HASH_TESTNET!;
	contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS_TESTNET!;
};

console.log(`chainId = ${chainId}`);
console.log(`local url = ${lcdUrl}`);
console.log(`code id = ${codeId}`);
console.log(`contract hash = ${contractCodeHash}`);
console.log(`contract address = ${contractAddress}`);


const queryParticipants = async (): Promise<string[]> => {
	const readOnlySecretjs = new SecretNetworkClient({
		url: lcdUrl,
		chainId: chainId,
	});

	type AllParticipantsRespose = { all_participants: string[] };
	let response: AllParticipantsRespose;
	try {
		response = await readOnlySecretjs.query.compute.queryContract({
			contract_address: contractAddress,
			code_hash: contractCodeHash,
			query: { get_all_participants: {} },
		}) as AllParticipantsRespose;
	} catch (e) {
		console.log(`error quering all participants: query contract error`);
		return [];
	}
	if ('err"' in response!) {
		console.log(`error quering all participants: ${response}`);
		return [];

	}
	console.log("queried smart contract: ", response);
	return response.all_participants;
};

const queryParticipated = async (): Promise<boolean> => {
	const readOnlySecretjs = new SecretNetworkClient({
		url: lcdUrl,
		chainId: chainId,
	});

	type DidIParticipateResponse = { participated: boolean };
	let response: DidIParticipateResponse;
	try {
		response = await readOnlySecretjs.query.compute.queryContract({
			contract_address: contractAddress,
			code_hash: contractCodeHash,
			query: { did_i_participate: { address: secretjs!.address } },
		}) as DidIParticipateResponse;
	} catch (e) {
		console.log(`error quering whether participated: query contract error`);
		return false;
	}
	if ('err"' in response!) {
		console.log(`error quering whether participated: ${response}`);
		return false;
	}
	console.log("queried smart contract (PARTICIPATED): ", response);
	return response.participated;
};

const queryLastWinner = async (): Promise<string> => {
	const readOnlySecretjs = new SecretNetworkClient({
		url: lcdUrl,
		chainId: chainId,
	});

	type WinnerResponse = { last_winner: string };
	let response: WinnerResponse;
	try {
		response = await readOnlySecretjs.query.compute.queryContract({
			contract_address: contractAddress,
			code_hash: contractCodeHash,
			query: { get_last_winner: {} },
		}) as WinnerResponse;
	} catch (e) {
		console.log(`error quering last winner: query contract error`);
		return "";
	}
	if ('err"' in response!) {
		console.log(`error quering last winner: ${response}`);
		return "";
	}
	console.log("queried smart contract: ", response!);
	return response!.last_winner;
};

const queryOwner = async (): Promise<string> => {
	const readOnlySecretjs = new SecretNetworkClient({
		url: lcdUrl,
		chainId: chainId,
	});
	console.dir(readOnlySecretjs, { depth: null });

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

const queryParticipantsCount = async (): Promise<number> => {
	const readOnlySecretjs = new SecretNetworkClient({
		url: lcdUrl,
		chainId: chainId,
	});

	type NumOfParticipantsResponse = { num: number };
	let response: NumOfParticipantsResponse;
	try {
		response = await readOnlySecretjs.query.compute.queryContract({
			contract_address: contractAddress,
			code_hash: contractCodeHash,
			query: { get_num_of_participants: {} },
		}) as NumOfParticipantsResponse;
	} catch (e) {
		console.log(`error quering participant count: query contract error`);
		return 0;
	}
	if ('err"' in response!) {
		console.log(`error quering participant count: ${response}`);
		return 0;
	}
	console.log("queried smart contract: ", response!);
	console.log("participants count: " + response!.num);
	return response!.num
};

const queryParticipationFee = async (): Promise<number> => {
	const readOnlySecretjs = new SecretNetworkClient({
		url: lcdUrl,
		chainId: chainId,
	});

	type FeeResponse = { participation_fee_uscrt: string };
	let response: FeeResponse;
	try {
		response = await readOnlySecretjs.query.compute.queryContract({
			contract_address: contractAddress,
			code_hash: contractCodeHash,
			query: { get_participation_fee: {} },
		}) as FeeResponse;
	} catch (e) {
		console.log(`error quering participation fee: query contract error`);
		return 0;
	}

	if ('err"' in response) {
		console.log(`error quering participation fee: query contract error`);
		return 0;
	}
	console.log("queried smart contract: ", response);
	console.log("SCRT NEEDED: ", convertUscrtToScrt(response.participation_fee_uscrt));
	return convertUscrtToScrt(response.participation_fee_uscrt)
};

// returns true is successful, false otherwise
const executeParticipate = async (feeScrt: number): Promise<boolean> => {
	const participationMsg = new MsgExecuteContract({
		sender: secretjs!.address,
		contract_address: contractAddress,
		code_hash: contractCodeHash,
		msg: { participate: {} },
		sent_funds: [{ amount: convertScrtToUscrt(feeScrt), denom: "uscrt" }],
	});

	console.log("Participation Message:", participationMsg);

	try {
		const tx = await secretjs!.tx.broadcast([participationMsg], {
			gasLimit: 200_000,
		});
		if (tx.rawLog.toLowerCase().includes("error")) {
			console.error(`Query failed with the following err: ${JSON.stringify(tx)}`)
			return false;
		}
		console.log("Transaction Response:", tx);
	} catch (error) {
		console.error("Error during participation:", error);
		return false;
	}
	return true;
}

// returns true is successful, false otherwise
const executeEndLottery = async (): Promise<boolean> => {
	const endLotteryMsg = new MsgExecuteContract({
		sender: secretjs!.address,
		contract_address: contractAddress,
		code_hash: contractCodeHash,
		msg: { end_lottery: {} },
	});

	console.log("End Lottery Message:", endLotteryMsg);

	try {
		const tx = await secretjs!.tx.broadcast([endLotteryMsg], {
			gasLimit: 200_000,
		});

		if (tx.rawLog.toLowerCase().includes("error")) {
			console.error(`Query failed with the following err: ${JSON.stringify(tx)}`);
			return false;
		}

		console.log("Transaction Response:", tx);
	} catch (error) {
		console.error("Error during end lottery:", error);
		return false;
	}
	return true;
}
// connected is true if user connected the wallet and false if disconncted, provides address if connected, empty string otherwise
const toggleWalletConnection = async (): Promise<{ connected: boolean; address: string }> => {
	if (secretjs != undefined) {// disconnect
		if (network_config == "0") {// localnet
			wallet = undefined;
		} else {// testnet
			if (window.keplr) {
				await window.keplr?.disable(chainId);
			}
			signer = undefined;
		}
		secretjs = undefined;
		return {// disconncted
			connected: false,
			address: ""
		};
	} else {// connect
		if (network_config == "0") {// localnet
			wallet = new Wallet(process.env.REACT_APP_MNEMONIC_LOCALNET!); // hardcoded wallet "a"
			alert(`we connect your localnet wallet 'a' (${wallet.address})`);
			secretjs = new SecretNetworkClient({
				chainId: chainId,
				url: lcdUrl,
				wallet: wallet,
				walletAddress: wallet.address,
			});
			console.log("localnet wallet: ");
			console.dir(wallet, { depth: null });
		} else {// testnet
			if (!window.keplr) {
				alert("Please install keplr extension");
				return {// kinda disconncted - cannot connect
					connected: false,
					address: ""
				};
			}
			// Enabling before using the Keplr is recommended.
			// This method will ask the user whether to allow access if they haven't visited this website.
			// Also, it will request that the user unlock the wallet if the wallet is locked.
			await window.keplr.enable(chainId);

			signer = window.keplr.getOfflineSignerOnlyAmino(chainId);
			let myWalletAddr: string;
			[{ address: myWalletAddr }] = await signer.getAccounts()

			console.log("Initializing Secret.js client ...");
			secretjs = new SecretNetworkClient({
				url: lcdUrl,
				chainId: chainId,
				wallet: signer,
				walletAddress: myWalletAddr,
				encryptionUtils: window.keplr.getEnigmaUtils(chainId),
			});
			console.log(`Created client for wallet address: ${myWalletAddr}`);
		}
		return {// connected
			connected: true,
			address: secretjs.address
		};
	}
}

export { secretjs, queryParticipants, queryOwner, queryLastWinner, queryParticipated, queryParticipationFee, queryParticipantsCount, executeParticipate, executeEndLottery, toggleWalletConnection };
