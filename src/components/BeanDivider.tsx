/**
 * The divider under every section heading: a thin warm-gold line, a small
 * coffee bean, another line. Inline SVG so it stays crisp and costs nothing.
 * `tone="dark"` for dark sections (the bean's centre crease matches the background).
 */
export default function BeanDivider({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const crease = tone === "dark" ? "#24160f" : "#efe6d6";
  return (
    <div aria-hidden className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#B08D65] md:w-20" />
      <svg width="16" height="20" viewBox="0 0 16 20" className="shrink-0">
        <ellipse cx="8" cy="10" rx="6.2" ry="8.6" transform="rotate(18 8 10)" fill="#B08D65" />
        <path d="M9.6 2.2C6.4 5 7.6 8.4 8.4 10.4s1.4 5.4-1.9 7.6" fill="none" stroke={crease} strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#B08D65] md:w-20" />
    </div>
  );
}
