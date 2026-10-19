// Shared by server and browser code, so this file must not import anything server-only.
export const MAX_ANSWER_CHARS = 4000;
export const MAX_CHAT_CHARS = 2000;
// Most concepts one module may hold; lessons for a whole module are written in one call.
export const MAX_CONCEPTS_PER_MODULE = 7;
// Quiz difficulty steps for "make the questions harder/easier". New lessons start at the bottom.
export const MIN_QUIZ_LEVEL = 1;
export const MAX_QUIZ_LEVEL = 5;
