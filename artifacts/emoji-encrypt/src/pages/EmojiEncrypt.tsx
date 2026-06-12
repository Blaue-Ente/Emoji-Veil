import { useState, useCallback } from "react";
import { encode } from "@/lib/encoder";
import { useVaultKey } from "@/hooks/use-vault-key";
import {
  Check,
  Copy,
  Zap,
  Lock,
  Key,
  ChevronRight,
  Shield,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
        disabled:opacity-30 disabled:cursor-not-allowed
        bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 hover:border-slate-500
        active:scale-95"
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-400" />
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

const STEPS = [
  "One-time: copy Vault Bootstrap → paste into LLM Custom Instructions (NOT the chat)",
  "Enter your command in any language → Generate",
  "Copy Message Unlock Code → paste in chat (safe — no secret key inside)",
  "Copy Emoji Payload → paste as next message",
  "Even if someone copies the unlock code, they cannot decode without your Vault Key",
];

export default function EmojiEncrypt() {
  const { vaultKey, maskedVaultKey, bootstrapPrompt, rotate, isReady } =
    useVaultKey();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    messageId: string;
    emojiSequence: string;
    unlockCode: string;
    uniqueTokenCount: number;
    poolSize: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) {
      setError("Please enter a command.");
      setResult(null);
      return;
    }
    if (!vaultKey) {
      setError("Vault key not ready. Refresh the page.");
      return;
    }

    setError("");
    setGenerating(true);
    try {
      const encoded = await encode(input, vaultKey);
      setResult({
        messageId: encoded.messageId,
        emojiSequence: encoded.emojiSequence,
        unlockCode: encoded.unlockCode,
        uniqueTokenCount: encoded.uniqueTokenCount,
        poolSize: encoded.poolSize,
      });
    } finally {
      setGenerating(false);
    }
  }, [input, vaultKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      void handleGenerate();
    }
  };

  const handleRotate = () => {
    if (
      window.confirm(
        "Rotate Vault Key? Old bootstrap in LLM Custom Instructions will stop working. You must paste the new bootstrap.",
      )
    ) {
      rotate();
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30">
              <Lock size={22} className="text-violet-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Emoji Encrypt for LLM
            </h1>
          </div>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            Vault Key stays on your device and in LLM Custom Instructions only.
            Chat messages carry encrypted one-shot unlock codes — copyable, but useless without the vault.
          </p>
        </header>

        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400 flex items-center gap-2">
            <AlertTriangle size={12} />
            Step 0 — Vault Bootstrap (one-time, private)
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Paste the bootstrap below into <strong className="text-slate-300">Custom Instructions</strong> or
            a private system prompt — <strong className="text-amber-300">never in a shared chat thread</strong>.
            It contains your Vault Key. The LLM should reply <code className="text-amber-200">EE3-VAULT-READY</code>.
          </p>
          {isReady && maskedVaultKey && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Local Vault Key: <span className="font-mono text-slate-400">{maskedVaultKey}</span></span>
              <button
                onClick={handleRotate}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw size={12} />
                Rotate key
              </button>
            </div>
          )}
          <OutputBlock
            step="Custom Instructions only"
            title="Vault Bootstrap Prompt"
            content={bootstrapPrompt}
            copyLabel="Copy Bootstrap"
            accentColor="amber"
            hint="ChatGPT: Settings → Personalization → Custom Instructions. Claude: Project Instructions. Never paste this in the conversation."
          />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Zap size={12} className="text-violet-400" />
            How it works
          </h2>
          <ol className="space-y-1.5">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
            <Shield size={12} />
            Privacy model (EE-v3)
          </h2>
          <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
            <li>• <strong className="text-slate-300">Split secrets:</strong> Vault Key (private) vs unlock code (chat-safe)</li>
            <li>• <strong className="text-slate-300">One-shot MID:</strong> each message has a unique ID — replay blocked after decode</li>
            <li>• <strong className="text-slate-300">Per-message keys:</strong> SHA-256(Vault + MID) — copying old unlock codes cannot decode new messages</li>
            <li>• <strong className="text-slate-300">Transport policy:</strong> LLM decodes mechanically; no refusal on emoji surface form</li>
            <li>• {result ? `${result.poolSize.toLocaleString()}` : "1,600+"} emoji alphabet with bigram overflow</li>
          </ul>
        </section>

        <section className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            Your command
          </label>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder={'Type in any language, e.g. "Send email to Peter with the results" or "Изпрати имейл на Петър с резултатите"'}
            rows={4}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 text-slate-100
              placeholder:text-slate-600 px-4 py-3 text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
              transition-colors"
          />
          {error && (
            <p className="text-sm text-rose-400 flex items-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">Tip: Ctrl+Enter to generate quickly</p>
            <button
              onClick={() => void handleGenerate()}
              disabled={generating || !isReady}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400
                text-white transition-all duration-200 active:scale-95 shadow-lg shadow-violet-900/30
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Key size={15} />
              {generating ? "Generating…" : "Generate"}
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {result && (
          <section className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-slate-500 text-xs px-2">
                MID {result.messageId.slice(0, 8)}… · {result.uniqueTokenCount} token{result.uniqueTokenCount !== 1 ? "s" : ""}
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <OutputBlock
              step="Step 2 — Paste in chat (safe to share visually)"
              title="Message Unlock Code"
              content={result.unlockCode}
              copyLabel="Copy Unlock Code"
              accentColor="violet"
              hint="Contains MID + encrypted PAY only. No Vault Key — useless without your Custom Instructions bootstrap."
            />

            <OutputBlock
              step="Step 3 — Paste as the NEXT message"
              title="Emoji Payload"
              content={result.emojiSequence}
              copyLabel="Copy Payload"
              accentColor="cyan"
              hint="Observers see random emojis. LLM derives the key from Vault + MID to decode."
              large
            />

            <p className="text-center text-xs text-slate-600">
              Each Generate creates a new MID and emoji mapping. Copied unlock codes from past messages cannot decode future payloads.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

interface OutputBlockProps {
  step: string;
  title: string;
  content: string;
  copyLabel: string;
  accentColor: "violet" | "cyan" | "emerald" | "amber";
  hint: string;
  large?: boolean;
}

function OutputBlock({ step, title, content, copyLabel, accentColor, hint, large }: OutputBlockProps) {
  const accent =
    accentColor === "violet"
      ? "border-violet-500/30 bg-violet-500/5"
      : accentColor === "cyan"
        ? "border-cyan-500/30 bg-cyan-500/5"
        : accentColor === "amber"
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-emerald-500/30 bg-emerald-500/5";
  const stepColor =
    accentColor === "violet"
      ? "text-violet-400"
      : accentColor === "cyan"
        ? "text-cyan-400"
        : accentColor === "amber"
          ? "text-amber-400"
          : "text-emerald-400";

  return (
    <div className={`rounded-xl border ${accent} p-5 space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest ${stepColor} mb-0.5`}>{step}</p>
          <h3 className="font-semibold text-slate-200 text-sm">{title}</h3>
        </div>
        <CopyButton text={content} label={copyLabel} />
      </div>
      <div
        className={`rounded-lg border border-slate-700/50 bg-slate-900/80 px-4 py-3
          text-sm text-slate-300 font-mono whitespace-pre-wrap overflow-auto
          ${large ? "text-lg leading-relaxed" : "leading-relaxed"}
          max-h-72 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent`}
        style={{ overflowY: "auto" }}
      >
        {content}
      </div>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}
