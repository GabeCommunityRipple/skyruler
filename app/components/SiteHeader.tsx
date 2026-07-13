import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Sky Ruler"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            priority
          />
          <span className="font-heading text-xl font-bold tracking-tight text-ink">
            Sky Ruler
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          <Link href="/#how-it-works" className="transition-colors hover:text-ink">
            How it works
          </Link>
          <Link href="/#industries" className="transition-colors hover:text-ink">
            Industries
          </Link>
          <Link href="/#why" className="transition-colors hover:text-ink">
            Why Sky Ruler
          </Link>
        </nav>

        <Link
          href="/measure"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
        >
          Launch Tool
        </Link>
      </div>
    </header>
  );
}
