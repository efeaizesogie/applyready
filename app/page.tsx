import { PasteBox } from "@/components/landing/PasteBox";
import { DashboardPreview } from "@/components/landing/DashboardPreview";

const STEPS = [
  { n: "1", title: "Paste the announcement", body: "A link or the full text of any scholarship, job, admission or grant." },
  { n: "2", title: "Get a ranked, dated checklist", body: "Every requirement, ranked by importance, with a best-by date that works back from the deadline." },
  { n: "3", title: "Get reminded until you submit", body: "One email a day with what's left — then a nudge to follow up if you don't hear back." },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="bg-grid relative overflow-hidden pt-20 text-center sm:pt-24">
        <FloatCard className="left-[4%] top-36 -rotate-3" label="Checklist planned" value="11 steps" note="back from the deadline" />
        <FloatCard className="right-[4%] top-64 rotate-2" label="Next reminder" value="8:00 am" note="3 things left · 12 days" />

        <div className="mx-auto max-w-4xl px-4">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface py-0.5 pl-0.5 pr-3 text-[13px] text-muted">
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-on-accent">For applicants</span>
            Scholarships · Jobs · Admissions · Grants
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-[clamp(2.5rem,7vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            Every application, <span className="whitespace-nowrap text-accent">shortlist-ready</span>.
          </h1>
          <p className="mx-auto mb-9 mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Paste an announcement. ApplyReady pulls out every requirement, plans it back from the deadline, and emails you each day until
            you&apos;ve submitted.
          </p>
          <PasteBox />
        </div>

        <div id="how-it-works" className="mx-auto mt-16 grid max-w-5xl scroll-mt-20 gap-3 px-4 text-left sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-[12px] border border-line bg-surface/70 p-4">
              <span className="font-mono text-xs text-accent">0{s.n}</span>
              <p className="mt-1 font-medium text-ink">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-5xl px-4">
          <DashboardPreview />
        </div>
      </section>
    </main>
  );
}

function FloatCard({ className, label, value, note }: { className: string; label: string; value: string; note: string }) {
  return (
    <div className={`absolute hidden w-48 rounded-[12px] border border-line bg-surface p-4 text-left text-[13px] xl:block ${className}`} aria-hidden>
      <p className="text-muted">{label}</p>
      <p className="text-2xl font-semibold tracking-[-0.02em] text-ink">{value}</p>
      <p className="text-muted">{note}</p>
    </div>
  );
}
