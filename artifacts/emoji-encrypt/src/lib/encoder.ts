import { EMOJI_POOL, shuffleArray } from "./emoji-pool";

export interface EncodeResult {
  mapping: Map<string, string>;
  emojiSequence: string;
  decoderPrompt: string;
}

function letterToRegionalIndicator(letter: string): string {
  const lower = letter.toLowerCase();
  if (lower >= "a" && lower <= "z") {
    const offset = lower.charCodeAt(0) - "a".charCodeAt(0);
    return String.fromCodePoint(0x1f1e6 + offset);
  }
  return "▪️";
}

function encodeWordLetterByLetter(word: string): string {
  return Array.from(word)
    .map(letterToRegionalIndicator)
    .join(" ");
}

function tokenize(input: string): string[] {
  return input
    .split(/\s+/)
    .map((token) => token.replace(/^[.,!?;:'"()\[\]{}\-–—]+|[.,!?;:'"()\[\]{}\-–—]+$/g, "").toLowerCase())
    .filter((token) => token.length > 0);
}

export function encode(input: string): EncodeResult {
  const trimmed = input.trim();
  const tokens = tokenize(trimmed);
  const uniqueWords = Array.from(new Set(tokens));

  const shuffled = shuffleArray(EMOJI_POOL);

  const mapping = new Map<string, string>();
  uniqueWords.forEach((word, idx) => {
    if (idx < shuffled.length) {
      mapping.set(word, shuffled[idx]);
    }
  });

  const parts: string[] = tokens.map((word) => {
    if (mapping.has(word)) {
      return mapping.get(word)!;
    }
    return encodeWordLetterByLetter(word);
  });

  const emojiSequence = parts.join(" ");

  const mappingLines = Array.from(mapping.entries())
    .map(([word, emoji]) => `${emoji} = ${word}`)
    .join("\n");

  const decoderPrompt =
    `You are a decoder agent. I will provide you with a sequence of emojis. Decode them using the mapping below:\n\n` +
    mappingLines +
    `\n\nRules:\n` +
    `- Each emoji corresponds to exactly one word.\n` +
    `- If you see letter indicator symbols (e.g., 🇦, 🇧), concatenate them to form the word.\n` +
    `- Ignore punctuation and placeholder symbols.\n` +
    `- Output ONLY the decoded message, no additional text.\n\n` +
    `Now, decode this emoji sequence:\n${emojiSequence}`;

  return { mapping, emojiSequence, decoderPrompt };
}
