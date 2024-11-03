import React, { useState, useEffect } from "react";
import { secretjs, queryParticipants, queryOwner, queryLastWinner, queryParticipated, queryParticipationFee, queryParticipantsCount, executeParticipate, executeEndLottery, toggleWalletConnection } from "./services/SecretNetworkLottery";
import Lottery from './components/Lottery';
import Loading from "./components/Loading";

const App: React.FC = () => {
	const DATA_REFRESH_RATE_MILLISECONDS = 10000;

	const [connectWalletBtnText, setConnectWalletBntText] = useState<string>("Connect");
	const [winningPool, setWinningPool] = useState<string>("_");

	const [participationFeeScrt, setParticipationFeeScrt] = useState<number>(0);
	const [isParticipant, setIsParticipant] = useState<string>("_");
	const [lastWinner, setLastWinner] = useState<string>("_");
	const [participants, setParticipants] = useState<string[]>([]);
	const [owner, setOwnerText] = useState<string>("_");
	const [participantsCount, setParticipantsCount] = useState<number>(0);

	const [loading, setLoading] = useState(false);
	const [loadingResultMessage, setLoadingResultMessage] = useState<'success' | 'error' | null>(null);
	const [loadingProcessMessage, setLoadingProcessMessage] = useState<string>("");

	useEffect(() => {
		const intervalId = setInterval(() => {
			if (secretjs != undefined) {
				queryLotteryInfo();
			}
		}, DATA_REFRESH_RATE_MILLISECONDS);
		return () => clearInterval(intervalId);
	}, []);

	async function handleWalletConnectionToggle() {
		const result = await toggleWalletConnection();
		if (result.connected) {
			setConnectWalletBntText(result.address.slice(0, 4) + "..." + result.address.slice(41))
			await queryLotteryInfo();
		} else { // disconnected
			setConnectWalletBntText("Connect");
			setParticipationFeeScrt(0);
			setIsParticipant("_");
			setLastWinner("_");
			setParticipants([]);
			setOwnerText("_");
			setParticipantsCount(0);
			setWinningPool("_");
		}
	}

	async function queryLotteryInfo() {
		setOwnerText(await queryOwner());
		const participantCount = await queryParticipantsCount();
		setParticipantsCount(participantCount);
		const participationFee = await queryParticipationFee();
		setParticipationFeeScrt(participationFee);
		setWinningPool((participationFee * participantCount).toString());
		setLastWinner(await queryLastWinner());
		setIsParticipant((await queryParticipated()) ? "yes" : "no");
		setParticipants(await queryParticipants());
	}

	const handleParticipate = async () => {
		setLoadingResultMessage(null);
		setLoading(true);
		setLoadingProcessMessage("trying to participate...");

		const success = await executeParticipate(participationFeeScrt);

		setLoadingResultMessage(success ? 'success' : 'error');
		setLoading(false);
		setTimeout(() => {
			setLoadingResultMessage(null);
		}, 5000);

		await queryLotteryInfo();
	};

	const handleEndLottery = async () => {
		setLoadingResultMessage(null);
		setLoading(true);
		setLoadingProcessMessage("trying to end the lottery...");

		const success = await executeEndLottery();

		setLoadingResultMessage(success ? 'success' : 'error');
		setLoading(false);
		setTimeout(() => {
			setLoadingResultMessage(null);
		}, 5000);

		await queryLotteryInfo();
	};


	return (
		<div className="App">
			<Loading
				loading={loading}
				loadingMessage={loadingProcessMessage}
				resultMessage={loadingResultMessage}
			/>
			<Lottery
				owner={owner}
				winningPool={winningPool}
				secretjs={secretjs}
				isParticipant={isParticipant}
				handleParticipate={handleParticipate}
				handleEndLottery={handleEndLottery}
				participationFeeScrt={participationFeeScrt}
				lastWinner={lastWinner}
				participantsCount={participantsCount}
				participants={participants}
				handleWalletConnectionToggle={handleWalletConnectionToggle}
				connectWalletBtnText={connectWalletBtnText}
				loading={loading}
			/>
		</div>
	);
};

export default App;
