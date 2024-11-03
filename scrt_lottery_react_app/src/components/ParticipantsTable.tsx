// src/components/ParticipantsTable.tsx
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface ParticipantsTableProps {
	participants: string[];
}

const ParticipantsTable: React.FC<ParticipantsTableProps> = ({ participants }) => {
	return (
		<TableContainer component={Paper} style={{ marginTop: '20px', maxWidth: 600, margin: 'auto' }}>
			<Table aria-label="participants table">
				<TableHead>
					<TableRow>
						<TableCell align="center" style={{ fontWeight: 'bold' }}>#</TableCell>
						<TableCell align="center" style={{ fontWeight: 'bold' }}>Participants</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{participants.map((participant, index) => (
						<TableRow key={index}>
							<TableCell align="center">{index + 1}</TableCell>
							<TableCell align="center">{participant}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default ParticipantsTable;

