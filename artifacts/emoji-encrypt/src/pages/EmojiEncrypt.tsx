import { useState, useCallback } from "react";
import { encode } from "@/lib/encoder";
import { Check, Copy, Zap, Lock, Key, ChevronRight } from "lucide-react";

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
  "Enter your command in any language",
  "Click Generate",
  "Copy the Decoder Prompt → paste into your LLM",
  "Copy the Emoji Sequence → paste right after the prompt",
  "Send to the LLM — it decodes only with both pieces",
];

export default function EmojiEncrypt() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ emojiSequence: string; decoderPrompt: string } | null>(null);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);

  const handleGenerate = useCallback(() => {
    if (!input.trim()) {
      setError("Please enter a command.");
      setResult(null);
      return;
    }
    setError("");
    const encoded = encode(input);
    setResult({ emojiSequence: encoded.emojiSequence, decoderPrompt: encoded.decoderPrompt });
    setWordCount(encoded.mapping.size);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* Header */}
        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30">
              <Lock size={22} className="text-violet-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Emoji Encrypt for LLM
            </h1>
          </div>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Encode natural language commands into emoji sequences. Only an LLM with the decoder prompt can read it.
          </p>
        </header>

        {/* How it works */}
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

        {/* Input */}
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
              onClick={handleGenerate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400
                text-white transition-all duration-200 active:scale-95 shadow-lg shadow-violet-900/30"
            >
              <Key size={15} />
              Generate
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* Output */}
        {result && (
          <section className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-slate-500 text-xs px-2">
                Mapped {wordCount} unique word{wordCount !== 1 ? "s" : ""}
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Decoder Prompt */}
            <OutputBlock
              step="Step 3 — Paste this FIRST into your LLM"
              title="LLM Decoder Prompt"
              content={result.decoderPrompt}
              copyLabel="Copy Prompt"
              accentColor="violet"
              hint="Paste this into the LLM chat window before the emoji sequence."
            />

            {/* Emoji Sequence */}
            <OutputBlock
              step="Step 4 — Paste this AFTER the prompt"
              title="Encrypted Emoji Sequence"
              content={result.emojiSequence}
              copyLabel="Copy Emojis"
              accentColor="cyan"
              hint="Paste this immediately after the decoder prompt, then send."
              large
            />

            <p className="text-center text-xs text-slate-600">
              Each time you click Generate, a brand-new random mapping is created — the same words get different emojis every time.
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
  accentColor: "violet" | "cyan";
  hint: string;
  large?: boolean;
}

function OutputBlock({ step, title, content, copyLabel, accentColor, hint, large }: OutputBlockProps) {
  const accent = accentColor === "violet"
    ? "border-violet-500/30 bg-violet-500/5"
    : "border-cyan-500/30 bg-cyan-500/5";
  const stepColor = accentColor === "violet" ? "text-violet-400" : "text-cyan-400";

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
