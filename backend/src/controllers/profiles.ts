import { Request, Response } from 'express';
import * as profilesService from '../services/profiles.js';

export async function getMyProfile(req: Request, res: Response): Promise<void> {
	try {
		const profile = await profilesService.getProfile(req.user!.id);

		if (!profile) {
			res.status(404).json({ data: null, error: 'Profile not found' });
			return;
		}

		res.json({ data: profile, error: null });
	} catch (error) {
		res.status(500).json({ data: null, error: 'Failed to fetch profile' });
	}
}

export async function updateMyProfile(req: Request, res: Response): Promise<void> {
	try {
		const { username, avatar_url } = req.body;

		if (!username && !avatar_url) {
			res.status(400).json({ data: null, error: 'No fields to update' });
			return;
		}

		const updates: { username?: string; avatar_url?: string } = {};
		if (username) updates.username = username;
		if (avatar_url) updates.avatar_url = avatar_url;

		const profile = await profilesService.updateProfile(req.user!.id, updates);
		res.json({ data: profile, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to update profile';
		const status = message === 'Username already taken' ? 409 : 500;
		res.status(status).json({ data: null, error: message });
	}
}
