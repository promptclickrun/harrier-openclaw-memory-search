type CodeBlockProps = {
  code: string;
  label?: string;
  lang?: string;
};

export function CodeBlock({ code, label, lang = "jsonc" }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-terminal shadow-[0_24px_70px_-40px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        {label && (
          <span className="ml-2 font-mono text-[11px] tracking-wide text-white/40">
            {label}
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-white/25">
          {lang}
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed text-white/85">
        <code>{code}</code>
      </pre>
    </div>
  );
}
