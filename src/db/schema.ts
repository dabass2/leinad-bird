import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const wordFrequencies = sqliteTable("word_frequencies", {
	rank: integer("rank").primaryKey(),
	word: text("word").notNull(),
	frequencyCount: integer("frequency_count"),
	stem: text("stem"),
	stemValidProbability: real("stem_valid_probability"),
	difficultyScore: real("difficulty_score"),
	difficultyTier: integer("difficulty_tier"),
	// SQLite doesn't have a native boolean; 1 = true, 0 = false
	wordInApi: integer("word_in_api").default(1),
	timesUsed: integer("times_used").default(0),
});
