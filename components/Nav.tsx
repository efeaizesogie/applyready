import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

// The mark: a ticked item on a list. Same shape as app/icon.svg, but themed.
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path d="M9 15.5l4.6 4.6L23.5 10" fill="none" className="stroke-on-accent" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 24.5h13" fill="none" className="stroke-on-accent" strokeOpacity=".45" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-ink">
      <LogoMark className="size-6" />
      ApplyReady
    </Link>
  );
}

export function Nav() {
  return (
    <nav className="border-b border-line">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
        <Logo />
        <div className="ml-auto flex items-center gap-1">
          <Link href="/#how-it-works" className="hidden rounded-[6px] px-3 py-1.5 text-[13px] text-muted hover:text-ink sm:block">
            How it works
          </Link>
          <Link href="/applications" className="rounded-[6px] px-3 py-1.5 text-[13px] text-muted hover:text-ink">
            My applications
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
