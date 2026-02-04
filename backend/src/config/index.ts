import 'dotenv/config';

export const config = {
	port: process.env.PORT || 3001,
	nodeEnv: process.env.NODE_ENV || 'development',
	supabase: {
		url: process.env.SUPABASE_URL || '',
		serviceKey: process.env.SUPABASE_SERVICE_KEY || ''
	},
	cors: {
		origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
	},
	ors: {
		apiKey: process.env.ORS_API_KEY || ''
	}
};

export function validateConfig(): void {
	const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
	const missing = required.filter(key => !process.env[key]);

	if (missing.length > 0 && config.nodeEnv === 'production') {
		throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
	}
}
