/**
 * What a rest break used to be worth.
 *
 * The rest period was once a five tab arcade: a quiz, a word game, a breathing timer, a
 * rep prediction and a rotating tip. It has been replaced by one screen (the clock, the next
 * set and the plates), because none of it was what anyone needed between sets.
 *
 * Growth points never decrease, though, and people earned these ones. So the counts stay in
 * `rest_activity` and these weights keep crediting them; nothing new is ever written there.
 * When the table is eventually empty of every account's history, this module and the growth
 * row that reads it can go.
 */

/** Per quiz answered correctly, fact read, or breath completed. */
export const REST_LEARNED_POINTS = 10;

/** Per scoring run of the word game. */
export const REST_GAME_POINTS_PER_RUN = 5;

/** Scoring runs of the game that any one session could ever be worth. */
export const REST_GAME_MAX_RUNS = 6;
