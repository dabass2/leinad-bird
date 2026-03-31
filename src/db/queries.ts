import { and, asc, eq, gt, gte, lte, sql } from "drizzle-orm";
import { db } from ".";
import { wordFrequencies } from "./schema";

/**
 * Fetches today's word and updates its usage count.
 * @param lower_freq The lower bound for word frequency
 * @param upper_freq The upper bound for word frequency
 */
export async function getAndPrepareDailyWord(
	lower_freq: number,
	upper_freq: number,
) {
	// 1. Select the word
	const [selectedWord] = await db
		.select()
		.from(wordFrequencies)
		.where(
			and(
				gte(wordFrequencies.frequencyCount, lower_freq),
				lte(wordFrequencies.frequencyCount, upper_freq),
				eq(wordFrequencies.wordInApi, 1),
				gt(sql`length(${wordFrequencies.word})`, 3),
			),
		)
		// Order by least used first, then pick a random one from that group
		.orderBy(asc(wordFrequencies.timesUsed), sql`RANDOM()`)
		.limit(1);

	if (!selectedWord) {
		throw new Error(
			`No available words found for frequency range ${lower_freq}-${upper_freq}`,
		);
	}

	return selectedWord;
}

/**
 * Increments the usage count for a specific word once it's confirmed for the game.
 */
export async function incrementUsage(rank: number) {
	return await db
		.update(wordFrequencies)
		.set({
			timesUsed: sql`${wordFrequencies.timesUsed} + 1`,
		})
		.where(eq(wordFrequencies.rank, rank));
}

/**
 * Updates whether a word exists in the external definition API.
 */
export async function updateApiStatus(rank: number, exists: boolean) {
	return await db
		.update(wordFrequencies)
		.set({
			// Maps boolean to 1/0 for SQLite
			wordInApi: exists ? 1 : 0,
		})
		.where(eq(wordFrequencies.rank, rank));
}
