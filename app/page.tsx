import { ScanPreview } from "@/components/scan/ScanPreview";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">
        Apply<span className="text-accent">Ready</span>
      </h1>
      <p className="mt-2 text-muted">Paste an announcement to see the plan ApplyReady builds from it.</p>
      <ScanPreview />
    </main>
  );
}
