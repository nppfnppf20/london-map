import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../services/supabase.js';
import type { Role } from '../types/index.js';

async function getUserRole(userId: string): Promise<Role> {
	const supabase = getSupabaseClient();
	const { data } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', userId)
		.single();
	return (data?.role as Role) || 'user';
}

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

		const role = await getUserRole(user.id);
		req.user = { id: user.id, email: user.email!, role };
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
			const role = await getUserRole(user.id);
			req.user = { id: user.id, email: user.email!, role };
		}
	} catch {
		// Silently continue without auth
	}

	next();
}
