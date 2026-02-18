import { Request, Response } from 'express';
import * as commentsService from '../services/comments.js';

export async function getComments(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const comments = await commentsService.getCommentsForPlace(id);
		res.json({ data: comments, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function addComment(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const { body } = req.body as { body?: string };

		if (!body?.trim()) {
			res.status(400).json({ data: null, error: 'Comment body is required' });
			return;
		}

		const comment = await commentsService.createComment(id, req.user!.id, body.trim());
		res.status(201).json({ data: comment, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		const owner = await commentsService.getCommentOwner(id);
		if (!owner) {
			res.status(404).json({ data: null, error: 'Comment not found' });
			return;
		}

		if (owner !== req.user!.id && req.user!.role !== 'admin') {
			res.status(403).json({ data: null, error: 'Not authorised to delete this comment' });
			return;
		}

		await commentsService.deleteComment(id);
		res.status(204).send();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}
