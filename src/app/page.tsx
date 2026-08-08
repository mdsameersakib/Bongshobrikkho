import Link from 'next/link'
import { ArrowUpRight, Heart, Leaf, LockKeyhole, Sparkles } from 'lucide-react'
import LandingTreeDemo from '@/components/LandingTreeDemo'
import ThemeToggle from '@/components/ThemeToggle'

const values = [
  {
    icon: Leaf,
    title: 'Let your family take shape',
    body: 'See the people you love and the ties between them, all in one gentle view.',
  },
  {
    icon: Heart,
    title: 'Keep what matters close',
    body: 'Hold on to the names, dates, and stories that make your family yours.',
  },
  {
    icon: LockKeyhole,
    title: 'Share it with care',
    body: 'Your family history stays personal, quiet, and shared on your terms.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background bg-texture">
      <a href="#tree" className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-cream">
        Skip to tree
      </a>

      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="BongshoBrikkho home">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-sand/40 bg-white shadow-sm dark:bg-surface">
            <Leaf size={19} className="text-forest dark:text-sage" strokeWidth={1.8} />
          </span>
          <span className="font-black tracking-[-0.04em] text-forest dark:text-sage">BongshoBrikkho</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-5">
          <a href="#tree" className="hidden text-sm font-bold text-foreground/60 transition-colors hover:text-forest dark:hover:text-sage sm:inline">
            Explore the tree
          </a>
          <ThemeToggle />
          <Link href="/login" className="rounded-full bg-forest px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-cream shadow-lg shadow-forest/15 transition-transform hover:-translate-y-0.5 dark:bg-sage dark:text-background">
            Enter your tree
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-10 sm:px-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16 lg:px-12 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-xl">
          <p className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-forest dark:text-sage">
            <Sparkles size={14} /> Your family story, held close
          </p>
          <h1 className="max-w-lg font-serif text-6xl font-medium leading-[0.96] tracking-[-0.07em] text-foreground sm:text-7xl lg:text-[5.8rem]">
            The people who made you.
          </h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-foreground/60 dark:text-foreground/65">
            BongshoBrikkho gives your family history a place to grow — names, stories, and the ties that hold everything together.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/login" className="group inline-flex items-center gap-3 rounded-full bg-forest px-6 py-3.5 text-sm font-black text-cream shadow-xl shadow-forest/20 transition-all hover:-translate-y-0.5 hover:bg-forest/90 dark:bg-sage dark:text-background">
              Begin your tree
              <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a href="#tree" className="rounded-full border border-sand/50 px-6 py-3.5 text-sm font-bold text-foreground/70 transition-colors hover:border-forest/40 hover:text-forest dark:border-sand/20 dark:hover:border-sage/50 dark:hover:text-sage">
              Take a look around
            </a>
          </div>
          <p className="mt-6 text-xs font-bold text-foreground/40">Start with the people you know. Let the rest unfold.</p>
        </div>

        <div id="tree" className="relative scroll-mt-8">
          <div className="absolute -inset-8 rounded-[4rem] bg-sage/10 blur-3xl dark:bg-sage/5" />
          <div className="relative overflow-hidden rounded-[2rem] border border-sand/50 bg-white/65 p-3 shadow-[0_30px_100px_rgba(84,107,65,0.14)] backdrop-blur-xl dark:border-sand/15 dark:bg-surface/70 sm:p-5">
            <div className="flex items-center justify-between px-3 pb-3 pt-1 sm:px-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-forest/70 dark:text-sage/80">Every family has its own shape</p>
                <p className="mt-1 text-sm font-bold text-foreground/60">Drag to wander · scroll to explore</p>
              </div>
              <span className="hidden rounded-full bg-sand/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-forest/70 dark:text-sage/80 sm:block">Demo tree</span>
            </div>
            <LandingTreeDemo />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-sand/30 px-6 py-20 sm:px-10 lg:px-12 lg:py-24">
        <div className="max-w-xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-forest dark:text-sage">Made for the stories in between</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.05em] text-foreground sm:text-5xl">Family history should feel like coming home.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {values.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-[1.75rem] border border-sand/30 bg-white/45 p-6 dark:border-sand/10 dark:bg-surface/45">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest/10 text-forest dark:bg-sage/15 dark:text-sage">
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <h3 className="mt-6 text-lg font-black tracking-[-0.03em] text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-foreground/55">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-sand/30 px-6 py-8 text-xs font-bold text-foreground/45 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12">
        <p className="tracking-[-0.01em]">BongshoBrikkho · বংশবৃক্ষ</p>
        <p>A softer way to remember where you come from.</p>
      </footer>
    </main>
  )
}
