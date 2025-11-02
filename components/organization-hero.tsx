'use client';

import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import { TimelineContent } from '@/components/ui/timeline-animation';
import { useMediaQuery } from '@/hooks/use-media-query';
import { AlignJustify, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Drawer } from 'vaul';
import { useRef, useState, type CSSProperties } from 'react';

const navigationItems = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Resources', href: '/privacy-policy' },
  { label: 'Blog', href: '/about' },
];

function OrganizationHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 992px)');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: 'blur(10px)',
      y: -20,
      opacity: 0,
    },
  };

  const scaleVariants = {
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: 'blur(10px)',
      scale: 0.8,
      opacity: 0,
    },
  };

  const handleLogin = () => {
    router.push('/sign-in');
  };

  const handleGetStarted = () => {
    router.push('/sign-up');
  };

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-100 to-white pb-12">
      <TimelineContent
        animationNum={11}
        timelineRef={heroRef}
        customVariants={revealVariants}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_55%)]"
      />

      <TimelineContent
        as="header"
        animationNum={0}
        timelineRef={heroRef}
        customVariants={revealVariants}
        className="sticky top-4 z-50 mx-auto flex w-full max-w-4xl items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-slate-900 backdrop-blur"
      >
        {!isMobile ? (
          <>
            <Link href="/" className="text-xl font-semibold uppercase tracking-wide">
              Logo
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              {navigationItems.map((item) => (
                <Link key={item.label} href={item.href} className="transition-colors hover:text-blue-600">
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={handleLogin}
              className="group relative flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
            >
              Log In
            </button>
          </>
        ) : (
          <Drawer.Root direction="left" open={isOpen} onOpenChange={setIsOpen}>
            <Drawer.Trigger className="grid h-10 place-content-center rounded-lg bg-slate-900 px-3 text-white">
              <AlignJustify />
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
              <Drawer.Content
                className="fixed left-3 top-3 bottom-3 z-50 flex w-72 outline-none"
                style={{ '--initial-transform': 'calc(100% + 12px)' } as CSSProperties}
              >
                <div className="flex h-full w-full grow flex-col rounded-2xl border border-slate-300 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-semibold uppercase">Logo</span>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-md bg-slate-800 px-3.5 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                      <X />
                    </button>
                  </div>
                  <ul className="mt-6 space-y-2">
                    {navigationItems.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      handleLogin();
                    }}
                    className="mt-auto rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-700/40 transition-colors hover:bg-blue-400"
                  >
                    Log In
                  </button>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        )}
      </TimelineContent>

      <TimelineContent
        as="article"
        animationNum={1}
        timelineRef={heroRef}
        customVariants={revealVariants}
        className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-40 text-center text-slate-800"
      >
        <TimelineContent
          animationNum={2}
          timelineRef={heroRef}
          customVariants={revealVariants}
          className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-md border border-slate-900/10 bg-slate-900 text-xs font-semibold uppercase tracking-wide text-white shadow"
        >
          <span className="rounded-md bg-blue-500 px-2 py-1 text-white">New</span>
          Make your event hand-picked with Guest Genius
        </TimelineContent>
        <TimelineContent
          as="h1"
          animationNum={3}
          timelineRef={heroRef}
          customVariants={scaleVariants}
          className="mx-auto mb-6 max-w-3xl text-balance text-4xl font-semibold capitalize text-slate-900 sm:text-5xl 2xl:text-6xl"
        >
          Designed for organisers
          {!isMobile && <br />}
          <span className="inline-block pt-4 text-5xl sm:text-6xl 2xl:text-7xl">
            <span className="bg-gradient-to-b from-slate-900 to-slate-900/40 bg-clip-text text-transparent">built to sell </span>
            <TimelineContent
              as="span"
              animationNum={4}
              timelineRef={heroRef}
              customVariants={scaleVariants}
              className="inline-block rounded-xl border-2 border-blue-300 bg-blue-500/20 px-3 text-blue-500 shadow-sm backdrop-blur"
            >
              tickets
            </TimelineContent>
          </span>
        </TimelineContent>
        <TimelineContent
          as="p"
          animationNum={5}
          timelineRef={heroRef}
          customVariants={revealVariants}
          className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base 2xl:max-w-3xl 2xl:text-lg"
        >
          From intimate gatherings to large-scale events, our platform provides everything you need to create, promote, and manage
          successful experiences with ease.
        </TimelineContent>
        <TimelineContent
          as="div"
          animationNum={6}
          timelineRef={heroRef}
          customVariants={scaleVariants}
          className="mt-6 flex w-fit flex-col gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6"
        >
          <button
            type="button"
            onClick={handleGetStarted}
            className="flex items-center gap-2 rounded-lg border border-blue-500 bg-gradient-to-t from-blue-500 to-blue-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition-transform hover:-translate-y-1"
          >
            <Sparkles size={20} />
            Get started
          </button>
          <Link
            href="https://cal.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.08),0px_10px_10px_-5px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-1"
          >
            <Image src="/placeholder.png" alt="Customer concierge" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
            Book a call
          </Link>
        </TimelineContent>
      </TimelineContent>

      <TimelineContent
        id="features"
        as="div"
        animationNum={7}
        timelineRef={heroRef}
        customVariants={revealVariants}
        className="relative z-10 mx-auto grid w-full max-w-6xl gap-4 px-6 pb-16 lg:grid-cols-3 sm:grid-cols-2"
      >
        <TimelineContent
          as="figure"
          animationNum={8}
          timelineRef={heroRef}
          customVariants={scaleVariants}
          className="group w-full overflow-hidden rounded-2xl bg-white p-4 shadow-lg"
        >
          <div className="relative flex h-80 flex-col overflow-hidden rounded-xl bg-gradient-to-t from-slate-50 to-white p-5">
            <div className="relative -left-32 top-6 flex w-[25rem] shrink-0 items-center justify-between gap-2 rounded-xl bg-white p-3 transition-all group-hover:-left-24 group-hover:top-16 group-hover:-rotate-12">
              <p className="text-sm text-slate-700">Host your dream event today</p>
              <button
                type="button"
                onClick={handleGetStarted}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/40"
              >
                Get Started
              </button>
            </div>
            <div className="relative -right-16 top-10 flex w-[25rem] shrink-0 items-center gap-4 rounded-xl bg-white p-3 transition-all group-hover:-right-12 group-hover:rotate-12">
              <button
                type="button"
                onClick={handleGetStarted}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/40"
              >
                Plan Now
              </button>
              <p className="text-sm text-slate-700">Tools that make planning easy</p>
            </div>
            <ProgressiveBlur className="pointer-events-none absolute bottom-0 left-0 h-[75%] w-full" blurIntensity={0.5} />
            <article className="mt-auto text-sm text-slate-600">
              <span className="font-semibold text-slate-500">Step 1</span>
              <p className="pt-2 text-slate-600">
                Start by creating your <span className="font-semibold text-slate-900">personalized event</span>. Choose a name, set the details, and you are{' '}
                <span className="font-semibold text-slate-900">ready to go</span>.
              </p>
            </article>
          </div>
        </TimelineContent>

        <TimelineContent
          as="figure"
          animationNum={9}
          timelineRef={heroRef}
          customVariants={scaleVariants}
          className="w-full overflow-hidden rounded-2xl bg-white p-4 shadow-lg"
        >
          <div className="relative flex h-80 flex-col rounded-xl bg-gradient-to-t from-slate-50 to-white p-5">
            <div className="relative mx-auto flex w-[80%] -translate-y-2 items-center gap-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
              <div className="h-14 w-14 rounded-xl bg-orange-500" />
              <p>Lorem ipsum dolor sit amet consectetur.</p>
            </div>
            <div className="relative z-10 -translate-x-4 rotate-6 flex w-[80%] items-center gap-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 shadow-md">
              <div className="h-14 w-14 rounded-xl bg-blue-500" />
              <div className="space-y-1">
                <span className="font-semibold text-slate-700">SaaS</span>
                <p>Automate invitations, reminders, and follow-ups seamlessly.</p>
              </div>
            </div>
            <div className="relative mx-auto flex w-[80%] translate-y-2 -rotate-6 items-center gap-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
              <div className="h-14 w-14 rounded-xl bg-green-500" />
              <p>Track attendee engagement from the first click.</p>
            </div>
            <ProgressiveBlur className="pointer-events-none absolute bottom-0 left-0 h-[75%] w-full" blurIntensity={0.5} />
            <article className="mt-auto text-sm text-slate-600">
              <span className="font-semibold text-slate-500">Step 2</span>
              <p>
                Set up your <span className="font-bold text-slate-900">event in minutes</span>, name it, drive it, <span className="font-bold text-slate-900">done</span>.
              </p>
            </article>
          </div>
        </TimelineContent>

        <TimelineContent
          id="solutions"
          as="figure"
          animationNum={10}
          timelineRef={heroRef}
          customVariants={scaleVariants}
          className="group w-full overflow-hidden rounded-2xl bg-white p-4 shadow-lg"
        >
          <div className="relative flex h-80 flex-col rounded-xl bg-gradient-to-t from-slate-50 to-white p-5">
            <div className="absolute inset-x-0 top-0 flex h-[75%] items-end justify-between gap-3 px-4">
              <div className="h-1/2 w-12 rounded-lg bg-gradient-to-b from-slate-300 to-white transition-all" />
              <div className="h-[65%] w-12 rounded-lg bg-gradient-to-b from-slate-300 to-white transition-all" />
              <div className="h-[85%] w-12 rounded-lg bg-gradient-to-b from-blue-500 to-white transition-all group-hover:h-[60%] group-hover:from-slate-300" />
              <div className="h-[75%] w-12 rounded-lg bg-gradient-to-b from-slate-300 to-white transition-all group-hover:h-[55%]" />
              <div className="h-[60%] w-12 rounded-lg bg-gradient-to-b from-slate-300 to-white transition-all group-hover:h-[85%] group-hover:from-blue-500" />
            </div>
            <ProgressiveBlur className="pointer-events-none absolute bottom-0 left-0 h-[50%] w-full" blurIntensity={3} />
            <article className="mt-auto text-sm text-slate-600">
              <span className="font-semibold text-slate-500">Step 3</span>
              <p>
                Optimise your <span className="font-bold text-slate-900">growth stack</span>, elevate visibility, and keep momentum going.
              </p>
            </article>
          </div>
        </TimelineContent>
      </TimelineContent>
    </section>
  );
}

export default OrganizationHero;
