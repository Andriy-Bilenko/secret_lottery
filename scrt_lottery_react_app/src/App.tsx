import React, { useState, useEffect } from "react";
import { SecretNetworkClient, MsgExecuteContract, Wallet } from "secretjs";
import { OfflineAminoSigner, Window as KeplrWindow } from "@keplr-wallet/types";

declare global {
	interface Window extends KeplrWindow { }
}

const DATA_REFRESH_RATE_MILLISECONDS = 10000;

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

const App: React.FC = () => {
	const [connectWalletBtnText, setConnectWalletBntText] = useState<string>("connect Wallet");

	const [participationFeeScrt, setParticipationFeeScrt] = useState<number>(0);
	const [isParticipant, setIsParticipant] = useState<string>("_");
	const [lastWinner, setLastWinner] = useState<string>("_");
	const [participants, setParticipants] = useState<string[]>([]);
	const [owner, setOwnerText] = useState<string>("_");
	const [participantsCount, setParticipantsCount] = useState<number>(0);

	const [winningPool, setWinningPool] = useState<string>("_");

	useEffect(() => {
		// Set up polling
		const intervalId = setInterval(() => {
			// Only poll if the user is connected
			if (secretjs != undefined) {
				queryLotteryInfo();
			}
		}, DATA_REFRESH_RATE_MILLISECONDS); // Poll every xx seconds
		// Cleanup on component unmount
		return () => clearInterval(intervalId);
	}, []);

	async function toggleConnectWallet() {
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
			setConnectWalletBntText("connect Wallet");
			setParticipationFeeScrt(0);
			setIsParticipant("_");
			setLastWinner("_");
			setParticipants([]);
			setOwnerText("_");
			setParticipantsCount(0);
			setWinningPool("_");
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
					return;
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
			setConnectWalletBntText("connected: " + secretjs.address + ", wanna disconnect?")
			await queryLotteryInfo();
		}
	}

	async function queryLotteryInfo() {
		let owner = await queryOwner();
		setOwnerText(owner);
		let participantCount = await queryParticipantsCount();
		setParticipantsCount(participantCount);
		let participationFee = await queryParticipationFee();
		setParticipationFeeScrt(participationFee);
		setWinningPool((participationFee * participantCount).toString());

		let lastWinner = await queryLastWinner();
		setLastWinner(lastWinner);

		let isParticipant = await queryParticipated();
		setIsParticipant(isParticipant ? "yes" : "no");

		let participants = await queryParticipants();
		setParticipants(participants);
	}

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
		// Check if the response has an error
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
		// Check if response is an object and contains the 'err' property
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
		setParticipantsCount(response!.num);
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

	const handleParticipate = async () => {
		// Create the participation message
		const participationMsg = new MsgExecuteContract({
			sender: secretjs!.address,
			contract_address: contractAddress,
			code_hash: contractCodeHash,
			msg: { participate: {} }, // The message to send to the contract
			sent_funds: [{ amount: convertScrtToUscrt(participationFeeScrt), denom: "uscrt" }], // Correct property name for funds
		});

		console.log("Participation Message:", participationMsg);

		try {
			// Broadcast the participation message
			const tx = await secretjs!.tx.broadcast([participationMsg], {
				gasLimit: 200_000, // Specify the gas limit
			});

			if (tx.rawLog.toLowerCase().includes("error")) {
				alert(`Query failed with the following err: ${JSON.stringify(tx)}`)
				return
			}

			console.log("Transaction Response:", tx);
			alert("Participation successful!");
		} catch (error) {
			console.error("Error during participation:", error);
			alert("Participation failed. Please check the console for more details.");
		}
		await queryLotteryInfo();
	};

	const handleEndLottery = async () => {
		// Create the participation message
		const endLotteryMsg = new MsgExecuteContract({
			sender: secretjs!.address,
			contract_address: contractAddress,
			code_hash: contractCodeHash,
			msg: { end_lottery: {} }, // The message to send to the contract
		});

		console.log("End Lottery Message:", endLotteryMsg);

		try {
			// Broadcast the participation message
			const tx = await secretjs!.tx.broadcast([endLotteryMsg], {
				gasLimit: 200_000, // Specify the gas limit
			});

			if (tx.rawLog.toLowerCase().includes("error")) {
				alert(`Query failed with the following err: ${JSON.stringify(tx)}`)
				return
			}

			console.log("Transaction Response:", tx);
			alert("end of lottery is successful!");
		} catch (error) {
			console.error("Error during end lottery:", error);
			alert("end lottery failed. Please check the console for more details.");
		}
		await queryLotteryInfo();
	};

	return (
		<div style={{ padding: "20px" }}>
			<div style={{ marginTop: "20px", textAlign: "center" }}>
				<h1>⭐lottery⭐</h1>
			</div>
			<h1>owner {owner}</h1>
			<h1>winning pool {winningPool} SCRT</h1>
			{(secretjs != undefined) && isParticipant == "no" && (
				<button onClick={handleParticipate}>participate</button>
			)}
			{((secretjs != undefined) && (secretjs.address == owner)) && (
				<button onClick={handleEndLottery}>end lottery</button>
			)}
			<div style={{ marginTop: "20px" }}>
				<h3>participation fee: {participationFeeScrt} SCRT</h3>
				<h3>participated: {isParticipant}</h3>
				<h3>last winner: {lastWinner}</h3>
				<h3>participants - {participantsCount}:</h3>
				<h3>{participants}</h3>
			</div>

			<div style={{ marginTop: "20px", textAlign: "right" }}>
				<button onClick={toggleConnectWallet}>{connectWalletBtnText}</button>
			</div>
		</div>
	);
};

export default App;
