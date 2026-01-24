import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/index.js';
import routes from './routes/index.js';

const app = express();

// Middleware
app.use(cors({
	origin: config.cors.origin,
	credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', routes);

// Start server
function start(): void {
	try {
		validateConfig();
	} catch (error) {
		console.warn('Config validation warning:', error);
	}

	app.listen(config.port, () => {
		console.log(`Server running on port ${config.port}`);
		console.log(`Environment: ${config.nodeEnv}`);
	});
}

start();
