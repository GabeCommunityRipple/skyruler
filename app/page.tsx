import Link from "next/link";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

const STEPS = [
  {
    n: "1",
    title: "Search the address",
    body: "Type any property address and Sky Ruler drops you onto crisp, high-resolution satellite imagery of the lot.",
  },
  {
    n: "2",
    title: "Trace the zones",
    body: "Pick Lawn, Driveway, Pest/Lot, or Fence and click around the area. Adjust the corners until the outline is dialed in.",
  },
  {
    n: "3",
    title: "Get instant numbers",
    body: "Square footage and linear feet calculate live. Copy the results or generate a clean report to send with your quote.",
  },
];

const INDUSTRIES = [
  { label: "Lawn Care & Landscaping", icon: "🌱" },
  { label: "Pest Control", icon: "🐜" },
  { label: "Fencing", icon: "🚧" },
  { label: "Paving & Sealcoating", icon: "🛣️" },
  { label: "Snow Removal", icon: "❄️" },
  { label: "Irrigation & Turf", icon: "💧" },
  { label: "Pressure Washing", icon: "💦" },
  { label: "Artificial Turf", icon: "🏟️" },
];

const REASONS = [
  {
    title: "Quote without the drive",
    body: "Measure a property from your desk before you ever get in the truck. Turn around estimates the same day a lead comes in.",
  },
  {
    title: "Accurate, defensible numbers",
    body: "Measurements come straight from satellite imagery and real-world scale — not guesswork or pacing off the lawn.",
  },
  {
    title: "Built for the trades",
    body: "Purpose-built zones for lawn, driveway, lot, and fence work. No CAD skills, no training, no clutter.",
  },
  {
    title: "Win more jobs",
    body: "Hand customers a clean, professional measurement report and look like the most organized bid on the street.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-brand-light/60 to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
            <div>
              <span className="inline-flex items-center rounded-full bg-brand-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
                Aerial Property Measurement
              </span>
              <h1 className="mt-5 font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                Measure any property
                <span className="text-brand"> from the sky.</span>
              </h1>
              <p className="mt-5 max-w-md text-lg leading-8 text-muted">
                Sky Ruler turns satellite imagery into precise lawn, driveway,
                lot, and fence measurements in seconds — so home service
                contractors can quote faster and win more jobs.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/measure"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-brand px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
                >
                  Launch the Tool
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-base font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  See how it works
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-xl">
                <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_30%_30%,#1f3a5f,#0b1524)] text-center">
                  <div className="rounded-xl border-2 border-dashed border-brand/70 bg-brand/10 px-10 py-8">
                    <p className="font-heading text-3xl font-bold text-white">
                      12,480 sq ft
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Lawn zone · measured in 8 seconds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted">
              Three steps from address to send-ready measurement. No apps to
              install, nothing to learn.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand font-heading text-lg font-bold text-white">
                  {step.n}
                </div>
                <h3 className="mt-5 font-heading text-xl font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 leading-7 text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Industries served */}
        <section id="industries" className="border-y border-slate-100 bg-slate-50/70">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Built for the field
              </h2>
              <p className="mt-4 text-lg text-muted">
                If your quote depends on square footage or linear feet, Sky
                Ruler was made for your crew.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {INDUSTRIES.map((industry) => (
                <div
                  key={industry.label}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
                >
                  <span className="text-2xl" aria-hidden>
                    {industry.icon}
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {industry.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Sky Ruler */}
        <section id="why" className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Why Sky Ruler
            </h2>
            <p className="mt-4 text-lg text-muted">
              A measuring tape you drive with a mouse. Faster quotes, sharper
              numbers, happier customers.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {REASONS.map((reason) => (
              <div
                key={reason.title}
                className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm"
              >
                <h3 className="font-heading text-xl font-semibold text-ink">
                  {reason.title}
                </h3>
                <p className="mt-2 leading-7 text-muted">{reason.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 pb-20">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand px-8 py-16 text-center shadow-lg">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Start measuring in the next minute.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
              No sign-up required. Open the tool, search an address, and pull
              your first measurement right now.
            </p>
            <Link
              href="/measure"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-white px-7 text-base font-semibold text-brand shadow-sm transition-transform hover:scale-[1.02]"
            >
              Launch the Tool
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
