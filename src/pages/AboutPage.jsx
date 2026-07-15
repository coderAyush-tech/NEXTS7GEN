import { ArrowRight, Lightbulb, Network, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import instituteArtwork from '../../WhatsApp Image 2026-06-29 at 10.47.03 PM.jpeg';

const principles = [
  {
    title: 'Connect',
    statement: 'Bridging minds. Building futures.',
    detail: 'Live learning gives students a place to ask questions, share ideas, and learn with guidance.',
    icon: Network,
  },
  {
    title: 'Create',
    statement: 'Innovate today. Inspire tomorrow.',
    detail: 'Practical skills become useful when students apply them through real projects.',
    icon: Lightbulb,
  },
  {
    title: 'Transform',
    statement: 'Technology-driven positive impact.',
    detail: 'Code reviews, 1:1 mentorship, and interview preparation help turn effort into progress.',
    icon: Wrench,
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[var(--page)] text-[var(--text-strong)]">
      <section className="border-b border-[var(--border-strong)]" aria-labelledby="about-heading">
        <div className="mx-auto grid w-full max-w-[90rem] gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.72fr)] lg:items-center lg:gap-20 lg:px-10 lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-5 border-l-4 border-cyan-500 pl-4 text-xs font-bold uppercase tracking-[0.2em] text-cyan-800 dark:text-cyan-300 sm:text-sm">
              About NEXT 7 GEN
            </p>
            <h1 id="about-heading" className="text-balance text-5xl font-black leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Learning should lead to something you can build.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-[var(--text)] sm:text-xl">
              NEXT 7 GEN is a coding institute built around a simple idea: students understand technology more deeply when they use it. Lessons connect to practical work, feedback, and the confidence to keep improving.
            </p>
          </div>

          <figure className="border border-[#244856] bg-[#071421] p-3 shadow-[12px_12px_0_0_#20c4d8] sm:p-4 sm:shadow-[18px_18px_0_0_#20c4d8]">
            <img
              src={instituteArtwork}
              width="1254"
              height="1254"
              alt="Official NEXT 7 GEN Institute of Technology artwork with the Connect, Create, and Transform principles"
              loading="lazy"
              decoding="async"
              className="aspect-square h-auto w-full object-cover"
            />
            <figcaption className="border-t border-[#244856] px-2 pt-4 pb-1 font-mono text-xs uppercase tracking-[0.16em] text-[#7fe9f2]">
              Official institute artwork
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24" aria-labelledby="mission-heading">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Our mission</p>
            <h2 id="mission-heading" className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
              Make learning useful, not abstract.
            </h2>
          </div>

          <div className="border-t-2 border-[var(--border-strong)] pt-6">
            <p className="text-xl font-semibold leading-8 text-[var(--text-strong)] sm:text-2xl sm:leading-9">
              We help students move from coding basics toward stronger problem-solving, real project work, and interview preparation without losing sight of the fundamentals.
            </p>
            <div className="mt-8 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
              <div className="bg-[var(--surface)] p-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">How learning happens</h3>
                <p className="mt-3 leading-7 text-[var(--text)]">Live sessions, practical skills, real projects, code reviews, and 1:1 mentorship.</p>
              </div>
              <div className="bg-[var(--surface)] p-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">Where it leads</h3>
                <p className="mt-3 leading-7 text-[var(--text)]">Interview preparation, placement guidance, and certificates that mark completed learning.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071421] text-[#f7f4e8]" aria-labelledby="principles-heading">
        <div className="mx-auto w-full max-w-[90rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#7fe9f2]">Our principles</p>
            <h2 id="principles-heading" className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
              Connect. Create. Transform.
            </h2>
          </div>

          <ol className="mt-12 grid border-t border-[#315363] lg:grid-cols-3">
            {principles.map(({ title, statement, detail, icon: Icon }, index) => (
              <li key={title} className="border-b border-[#315363] py-8 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#7fe9f2]">0{index + 1}</span>
                  <Icon aria-hidden="true" className="size-7 text-[#20c4d8]" strokeWidth={1.6} />
                </div>
                <h3 className="mt-8 text-3xl font-black tracking-[-0.035em]">{title}</h3>
                <p className="mt-3 font-semibold text-[#7fe9f2]">{statement}</p>
                <p className="mt-5 max-w-sm leading-7 text-[#bfd0d3]">{detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-[var(--border-strong)]" aria-labelledby="about-cta-heading">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Learn by doing</p>
            <h2 id="about-cta-heading" className="mt-4 text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl">
              Find the course that fits your next step.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/courses"
              className="group inline-flex min-h-12 items-center justify-center gap-3 border-2 border-cyan-500 bg-cyan-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-950 transition-colors hover:bg-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-500"
            >
              Explore courses
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/admission"
              className="inline-flex min-h-12 items-center justify-center gap-3 border-2 border-[var(--border-strong)] bg-[var(--surface)] px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-strong)] transition-colors hover:border-cyan-500 hover:bg-[var(--surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-500"
            >
              Apply for admission
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
