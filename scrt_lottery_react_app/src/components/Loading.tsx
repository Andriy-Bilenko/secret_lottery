import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

interface LoadingProps {
	loading: boolean;
	loadingMessage: string;
	resultMessage: 'success' | 'error' | null;
}

const Loading: React.FC<LoadingProps> = ({ loading, loadingMessage, resultMessage }) => {
	useEffect(() => {
		if (resultMessage) {
			const timer = setTimeout(() => {
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [resultMessage]);

	return (
		<Box
			sx={{
				position: 'fixed',
				top: '20px', // Margin from the top
				left: '50%', // Center horizontally
				transform: 'translateX(-50%)', // Offset to center properly
				width: '300px', // Set a specific width
				zIndex: 1000,
				backgroundColor: 'white', // Solid background
				display: loading || resultMessage ? 'flex' : 'none',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center', // Center the content vertically
				boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)', // Optional shadow for better visibility
				borderRadius: '8px', // Optional rounded corners for a nicer look
			}}
		>
			{loading && <CircularProgress />}
			<Typography sx={{ mt: 2 }}>{loading ? loadingMessage : null}</Typography>
			{resultMessage && (
				<Typography
					sx={{
						mt: 1,
						color: resultMessage === 'success' ? 'green' : 'red',
					}}
				>
					{resultMessage === 'success' ? 'Success!' : 'Failure!'}
				</Typography>
			)}
		</Box>
	);
};

export default Loading;
