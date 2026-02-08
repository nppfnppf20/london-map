import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../services/supabase.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith('Bearer ')) {
		res.status(401).json({ data: null, error: 'Missing or invalid authorization header' });
		return;
	}

	const token = authHeader.slice(7);

	try {
		const supabase = getSupabaseClient();
		const { data: { user }, error } = await supabase.auth.getUser(token);

		if (error || !user) {
			res.status(401).json({ data: null, error: 'Invalid or expired token' });
			return;
		}

		req.user = { id: user.id, email: user.email! };
		next();
	} catch {
		res.status(401).json({ data: null, error: 'Authentication failed' });
	}
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith('Bearer ')) {
		next();
		return;
	}

	const token = authHeader.slice(7);

	try {
		const supabase = getSupabaseClient();
		const { data: { user }, error } = await supabase.auth.getUser(token);

		if (!error && user) {
			req.user = { id: user.id, email: user.email! };
		}
	} catch {
		// Silently continue without auth
	}

	next();
}
