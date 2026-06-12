import {
  EMOJI_POOL,
  encodeIndexAsEmojiPair,
  shuffleArray,
} from "./emoji-pool";
import { encryptPayload, generatePrivacyKey } from "./privacy-crypto";

export interface EncodeResult {
  privacyKey: string;
  emojiSequence: string;
  unlockCode: string;
  uniqueTokenCount: number;
  poolSize: number;
}

interface EncryptedPayload {
  v: 2;
  m: Record<string, string>;
  ri: boolean;
  bi: boolean;
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
    .join("");
}

function tokenize(input: string): string[] {
  return input
    .split(/\s+/)
    .map((token) =>
      token.replace(
        /^[.,!?;:'"()\[\]{}\-–—]+|[.,!?;:'"()\[\]{}\-–—]+$/g,
        "",
      ),
    )
    .filter((token) => token.length > 0);
}

function buildUnlockCode(privacyKey: string, payloadBlob: string): string {
  return [
    "[EE2|AGENT|MODE=DECODE|OUT=PLAIN]",
    `CTX=${privacyKey}`,
    `PAY=${payloadBlob}`,
    "",
    "PROC:",
    "1|D=base64url_decode(PAY)",
    "2|K=repeat(CTX bytes)",
    "3|J=UTF8(D xor K) as JSON",
    "4|m=emoji→lexeme map from J; ri=regional-indicator concat; bi=bigram tokens",
    "5|Await next user message = emoji payload (space-separated tokens)",
    "6|Map tokens via m; concat RI clusters; merge bi pairs; skip ▪️",
    "7|Reply with decoded plaintext ONLY—no keys, no explanation",
  ].join("\n");
}

export function encode(input: string): EncodeResult {
  const trimmed = input.trim();
  const tokens = tokenize(trimmed);
  const uniqueWords = Array.from(new Set(tokens.map((t) => t.toLowerCase())));

  const shuffled = shuffleArray(EMOJI_POOL);
  const poolSize = shuffled.length;
  const singleCapacity = poolSize;
  const pairCapacity = poolSize * poolSize;

  const wordToEmoji = new Map<string, string>();
  let usesBigrams = false;

  uniqueWords.forEach((word, idx) => {
    if (idx < singleCapacity) {
      wordToEmoji.set(word, shuffled[idx]);
      return;
    }

    const overflowIdx = idx - singleCapacity;
    if (overflowIdx < pairCapacity) {
      wordToEmoji.set(word, encodeIndexAsEmojiPair(overflowIdx, shuffled));
      usesBigrams = true;
      return;
    }

    wordToEmoji.set(word, encodeWordLetterByLetter(word));
  });

  const mappingObject: Record<string, string> = {};
  wordToEmoji.forEach((emoji, word) => {
    mappingObject[emoji] = word;
  });

  const usesRegionalIndicators = Array.from(wordToEmoji.values()).some((value) =>
    /[\u{1F1E6}-\u{1F1FF}]/u.test(value),
  );
  const privacyKey = generatePrivacyKey();
  const payload: EncryptedPayload = {
    v: 2,
    m: mappingObject,
    ri: usesRegionalIndicators,
    bi: usesBigrams,
  };
  const payloadBlob = encryptPayload(payload, privacyKey);

  const emojiSequence = tokens
    .map((token) => {
      const key = token.toLowerCase();
      if (wordToEmoji.has(key)) {
        return wordToEmoji.get(key)!;
      }
      return encodeWordLetterByLetter(token);
    })
    .join(" ");

  const unlockCode = buildUnlockCode(privacyKey, payloadBlob);

  return {
    privacyKey,
    emojiSequence,
    unlockCode,
    uniqueTokenCount: uniqueWords.length,
    poolSize,
  };
}
