import { getSupabaseClient } from './supabase.js';
import type { Comment } from '../types/index.js';

const TABLE_NAME = 'comments';

type CommentRow = {
	id: string;
	place_id: string;
	user_id: string;
	body: string;
	created_at: string;
};

type ProfileRow = {
	id: string;
	username: string | null;
	avatar_url: string | null;
};

async function attachAuthors(supabase: ReturnType<typeof getSupabaseClient>, rows: CommentRow[]): Promise<Comment[]> {
	if (rows.length === 0) return [];

	const userIds = [...new Set(rows.map(r => r.user_id))];
	const { data: profiles } = await supabase
		.from('profiles')
		.select('id, username, avatar_url')
		.in('id', userIds);

	const profileMap = new Map<string, ProfileRow>((profiles || []).map((p: ProfileRow) => [p.id, p]));

	return rows.map(row => {
		const profile = profileMap.get(row.user_id);
		return {
			...row,
			author: profile ? { username: profile.username, avatar_url: profile.avatar_url } : undefined
		};
	});
}

export async function getCommentsForPlace(placeId: string): Promise<Comment[]> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.select('*')
		.eq('place_id', placeId)
		.order('created_at', { ascending: true });

	if (error) {
		throw new Error(`Failed to fetch comments: ${error.message}`);
	}

	return attachAuthors(supabase, (data || []) as CommentRow[]);
}

export async function createComment(placeId: string, userId: string, body: string): Promise<Comment> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.insert({ place_id: placeId, user_id: userId, body })
		.select('*')
		.single();

	if (error) {
		throw new Error(`Failed to create comment: ${error.message}`);
	}

	const [comment] = await attachAuthors(supabase, [data as CommentRow]);
	return comment;
}

export async function getCommentOwner(id: string): Promise<string | null> {
	const supabase = getSupabaseClient();
	const { data } = await supabase
		.from(TABLE_NAME)
		.select('user_id')
		.eq('id', id)
		.single();
	return data?.user_id || null;
}

export async function deleteComment(id: string): Promise<boolean> {
	const supabase = getSupabaseClient();

	const { error } = await supabase
		.from(TABLE_NAME)
		.delete()
		.eq('id', id);

	if (error) {
		throw new Error(`Failed to delete comment: ${error.message}`);
	}

	return true;
}
