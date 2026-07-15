import { ArrowRight, Award, Code2, MessageSquareCode, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

const learningPath = [
  {
    step: '01',
    title: 'Learn live',
    description: 'Work through technical ideas with guidance and room to ask better questions.',
    icon: Radio,
  },
  {
    step: '02',
    title: 'Build real projects',
    description: 'Turn each concept into practical work that makes the lesson concrete.',
    icon: Code2,
  },
  {
    step: '03',
    title: 'Review the code',
    description: 'Use code reviews and 1:1 mentorship to see what works and what to improve.',
    icon: MessageSquareCode,
  },
  {
    step: '04',
    title: 'Prepare with purpose',
    description: 'Strengthen interview readiness with placement guidance and a certificate on completion.',
    icon: Award,
  },
];

function CodeLearningLoop() {
  return (
    <figure
      className="border border-[#1e4052] bg-[#081726] text-[#f7f4e8] shadow-[12px_12px_0_0_#20c4d8] sm:shadow-[18px_18px_0_0_#20c4d8]"
      aria-labelledby="learning-loop-title"
    >
      <figcaption className="flex items-center justify-between border-b border-[#1e4052] px-4 py-3 sm:px-6">
        <span id="learning-loop-title" className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#7fe9f2]">
          A learner&apos;s build loop
        </span>
        <Code2 aria-hidden="true" className="size-5 text-[#20c4d8]" strokeWidth={1.7} />
      </figcaption>

      <div className="overflow-hidden px-4 py-6 sm:px-7 sm:py-8">
        <pre className="whitespace-pre-wrap font-mono text-[0.72rem] leading-6 [overflow-wrap:anywhere] min-[360px]:text-[0.78rem] sm:text-sm sm:leading-8">
          <code>
            <span className="text-[#688397]">01</span>{'  '}
            <span className="text-[#7fe9f2]">const</span> direction = <span className="text-[#f0c66d]">&apos;practical skills&apos;</span>;
            {'\n'}
            <span className="text-[#688397]">02</span>{'  '}
            <span className="text-[#7fe9f2]">while</span> (learning) {'{'}
            {'\n'}
            <span className="text-[#688397]">03</span>{'    '}join(liveSessions);
            {'\n'}
            <span className="text-[#688397]">04</span>{'    '}build(realProjects);
            {'\n'}
            <span className="text-[#688397]">05</span>{'    '}review(code);
            {'\n'}
            <span className="text-[#688397]">06</span>{'    '}ask(mentor);
            {'\n'}
            <span className="text-[#688397]">07</span>{'  '}{'}'}
            {'\n'}
            <span className="text-[#688397]">08</span>{'  '}prepare(<span className="text-[#f0c66d]">&apos;interview&apos;</span>);
          </code>
        </pre>
      </div>

      <div className="grid border-t border-[#1e4052] sm:grid-cols-3">
        {['Understand', 'Build', 'Improve'].map((label, index) => (
          <div
            key={label}
            className="flex items-baseline gap-3 border-[#1e4052] px-4 py-4 sm:border-r sm:px-5 last:sm:border-r-0"
          >
            <span className="font-mono text-xs text-[#20c4d8]">0{index + 1}</span>
            <span className="text-sm font-semibold tracking-wide">{label}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

export default function HomePage() {
  return (
    <div className="bg-[var(--page)] text-[var(--text-strong)]">
      <section className="border-b border-[var(--border-strong)]" aria-labelledby="home-heading">
        <div className="mx-auto grid w-full max-w-[90rem] gap-14 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.88fr)_minmax(30rem,1.12fr)] lg:items-center lg:gap-20 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <p className="mb-5 border-l-4 border-cyan-500 pl-4 text-xs font-bold uppercase tracking-[0.2em] text-cyan-800 dark:text-cyan-300 sm:text-sm">
              NEXT 7 GEN Institute of Technology
            </p>
            <h1 id="home-heading" className="text-balance text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Learn the craft.
              <span className="mt-2 block text-cyan-700 dark:text-cyan-300">Build the work.</span>
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-[var(--text)] sm:text-xl">
              Live learning for students who want practical skills, real projects, thoughtful code reviews, and a clearer path toward interviews.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
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

          <div className="pb-5 pr-3 sm:pb-7 sm:pr-5">
            <CodeLearningLoop />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24" aria-labelledby="learning-path-heading">
        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">The learning path</p>
            <h2 id="learning-path-heading" className="mt-4 max-w-md text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
              Progress has a process.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[var(--text)]">
              Learning by doing keeps every stage connected: understand the idea, put it to work, get feedback, and prepare for what comes next.
            </p>
          </div>

          <ol className="border-t-2 border-[var(--border-strong)]">
            {learningPath.map(({ step, title, description, icon: Icon }) => (
              <li key={step} className="grid gap-4 border-b border-[var(--border)] py-6 sm:grid-cols-[3rem_3rem_minmax(0,1fr)] sm:items-start sm:gap-5">
                <span className="font-mono text-sm font-bold text-cyan-700 dark:text-cyan-300">{step}</span>
                <Icon aria-hidden="true" className="size-6 text-[var(--text-strong)]" strokeWidth={1.7} />
                <div>
                  <h3 className="text-xl font-extrabold tracking-[-0.02em]">{title}</h3>
                  <p className="mt-2 max-w-2xl leading-7 text-[var(--text)]">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#071421] text-[#f7f4e8]" aria-labelledby="home-cta-heading">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#7fe9f2]">Start where you are</p>
            <h2 id="home-cta-heading" className="mt-4 text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl">
              Choose a course, then learn by building.
            </h2>
          </div>
          <Link
            to="/courses"
            className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 border-2 border-[#7fe9f2] px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-[#7fe9f2] transition-colors hover:bg-[#7fe9f2] hover:text-[#071421] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f4e8]"
          >
            View the courses
            <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
