import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row">
        <p>© {new Date().getFullYear()} Sky Ruler. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/#how-it-works" className="hover:text-ink">
            How it works
          </Link>
          <Link href="/#industries" className="hover:text-ink">
            Industries
          </Link>
          <Link href="/measure" className="font-semibold text-brand hover:text-brand-dark">
            Launch Tool
          </Link>
        </div>
      </div>
    </footer>
  );
}
