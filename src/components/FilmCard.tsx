import Image from "next/image";

/** A photograph presented as a film print: cream paper edge, hairline of gold, grain. */
export default function FilmCard({
  src,
  alt,
  caption,
  sizes = "320px",
  priority = false,
  className = "",
  ratio = "aspect-[4/5]",
}: {
  src: string;
  alt: string;
  caption?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  ratio?: string;
}) {
  return (
    <figure className={`film-card ${className}`}>
      <div className={`film-frame relative overflow-hidden ${ratio}`}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
      {caption && <figcaption className="script px-1 pb-0.5 pt-2 text-center text-[1.15rem] leading-none text-cherry">{caption}</figcaption>}
    </figure>
  );
}

/** A slow, endless strip of film prints. Pauses under reduced motion. */
export function FilmStrip({ items, className = "" }: { items: { src: string; alt: string; caption: string }[]; className?: string }) {
  return (
    <div className={`film-strip overflow-hidden ${className}`}>
      <ul className="film-strip-track flex w-max gap-6 py-6 pr-6">
        {[...items, ...items].map((it, i) => (
          <li key={i} aria-hidden={i >= items.length} className={`w-[200px] shrink-0 md:w-[240px] ${i % 2 ? "rotate-[1.5deg]" : "-rotate-[1.5deg]"}`}>
            <FilmCard src={it.src} alt={i >= items.length ? "" : it.alt} caption={it.caption} sizes="240px" ratio="aspect-[5/4]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
