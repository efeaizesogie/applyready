import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-ink">
      <span className="grid size-6 place-items-center rounded-[6px] bg-accent" aria-hidden>
        <svg viewBox="0 0 12 12" className="size-3 text-on-accent">
          <path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
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
