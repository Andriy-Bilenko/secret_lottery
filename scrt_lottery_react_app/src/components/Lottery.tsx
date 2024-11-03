// src/components/Lottery.tsx
import React from 'react';
import { Button, Typography, Card, CardContent, Container, Grid, Divider } from '@mui/material';
import ParticipantsTable from './ParticipantsTable';

interface LotteryProps {
	owner: string;
	winningPool: string;
	secretjs: { address: string } | undefined;
	isParticipant: string;
	handleParticipate: () => void;
	handleEndLottery: () => void;
	participationFeeScrt: number;
	lastWinner: string;
	participantsCount: number;
	participants: string[];
	handleWalletConnectionToggle: () => void;
	connectWalletBtnText: string;
	loading: boolean;
}

const Lottery: React.FC<LotteryProps> = ({
	owner,
	winningPool,
	secretjs,
	isParticipant,
	handleParticipate,
	handleEndLottery,
	participationFeeScrt,
	lastWinner,
	participantsCount,
	participants,
	handleWalletConnectionToggle,
	connectWalletBtnText,
	loading
}) => {
	return (
		<Container maxWidth="md" style={{ padding: "20px" }}>
			<Card style={{ padding: "30px", borderRadius: "12px", boxShadow: "0px 4px 12px rgba(0,0,0,0.1)" }}>
				<CardContent>
					<div style={{ position: 'relative', paddingBottom: '20px' }}>
						{/* Centered title */}
						<Typography variant="h3" align="center" gutterBottom>
							Secret Lottery
						</Typography>

						<Button
							variant="outlined"
							color="primary"
							onClick={handleWalletConnectionToggle}
							style={{ position: 'absolute', right: 0, top: 0 }}
							sx={{ borderRadius: "8px" }}
						>
							{connectWalletBtnText}
						</Button>
					</div>

					<Divider sx={{ my: 2 }} />

					<Typography variant="h5" color="textSecondary" gutterBottom>
						Owner: <strong>{owner}</strong>
					</Typography>
					<Typography variant="h5" color="primary" gutterBottom>
						Winning Pool: <strong>{winningPool} SCRT</strong>
					</Typography>

					<Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
						{secretjs && isParticipant === "no" && (
							<Grid item>
								<Button
									variant="contained"
									color="primary"
									onClick={handleParticipate}
									sx={{ borderRadius: "8px", padding: "10px 20px" }}
									disabled={loading}
								>
									Participate
								</Button>
							</Grid>
						)}
						{secretjs && secretjs.address === owner && (
							<Grid item>
								<Button
									variant="contained"
									color="secondary"
									onClick={handleEndLottery}
									sx={{ borderRadius: "8px", padding: "10px 20px" }}
									disabled={loading}
								>
									End Lottery
								</Button>
							</Grid>
						)}
					</Grid>

					<Divider sx={{ my: 3 }} />

					<Typography variant="subtitle1" gutterBottom>
						Participation Fee: <strong>{participationFeeScrt} SCRT</strong>
					</Typography>
					<Typography variant="subtitle1" gutterBottom>
						Participated: <strong>{isParticipant}</strong>
					</Typography>
					<Typography variant="subtitle1" gutterBottom>
						Last Winner: <strong>{lastWinner}</strong>
					</Typography>
					<Typography variant="subtitle1" gutterBottom>
						Total Participants: <strong>{participantsCount}</strong>
					</Typography>

					<ParticipantsTable participants={participants} />
				</CardContent>
			</Card>
		</Container >
	);
};

export default Lottery;
