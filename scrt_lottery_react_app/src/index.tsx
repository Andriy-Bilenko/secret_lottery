import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from '@mui/material/styles'; // Import ThemeProvider
import theme from './styles/Theme'; // Import your theme

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);
//<React.StrictMode>
//	<ThemeProvider theme={theme}>
//		<App />
//	</ThemeProvider>
root.render(
	<React.StrictMode>
		<ThemeProvider theme={theme}>
			<App />
		</ThemeProvider>
	</React.StrictMode>
);

reportWebVitals();

