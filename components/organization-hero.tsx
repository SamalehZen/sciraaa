'use client';

import { Banner } from '@/components/ui/banner';
import { CpuArchitecture } from '@/components/ui/cpu-architecture';
import Marquee from '@/components/ui/marquee';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import { cn } from '@/lib/utils';
import { ArrowUpRight, Play, Star, Users } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import HomeHeader from './organization-hero-header';

const marqueeLogos = [
  { name: 'Hyper', src: '/hyper.png' },
  { name: 'Exa', src: '/exa.png' },
  { name: 'Tavily', src: '/tavily-color.svg' },
  { name: 'Parallel', src: '/parallel-icon.svg' },
  { name: 'Supermemory', src: '/supermemory.svg' },
  { name: 'Launch', src: '/Launch_SVG_Light.svg' },
];

export default function StreamLineHero() {
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/sign-up');
  };

  const handleWatchDemo = () => {
    router.push('/about');
  };

  return (
    <section className={cn('min-h-screen transition-colors', localTheme === 'dark' ? 'dark bg-neutral-950' : 'bg-white')}>
      <div className="mx-auto px-4 sm:px-10 2xl:container 2xl:px-10">
        <Banner
          href="https://pro.ui-layouts.com"
          target="_blank"
          rel="noreferrer"
          variant="rainbow"
          className="relative z-10 h-11 text-xs sm:text-sm md:text-base"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="text-lg">🚀</span>
            Ship faster with <span className="font-semibold">UI-Layouts Pro</span>
            <span className="hidden md:inline-block">50+ Tailwind & React components for production-ready UIs</span>
            <ArrowUpRight className="ml-1 size-5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2} />
          </span>
        </Banner>
        <HomeHeader localTheme={localTheme} setLocalTheme={setLocalTheme} />
        <div className="relative overflow-hidden py-16 md:flex md:items-center md:justify-start md:py-24 lg:py-40">
          <div className="flex items-center justify-start">
            <motion.div
              className="w-full md:max-w-lg xl:max-w-xl"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <motion.h2
                className="mb-2 text-3xl font-normal text-gray-900 leading-tight sm:mb-6 sm:text-5xl lg:text-6xl xl:text-7xl dark:text-gray-100"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Build{' '}
                <span className="bg-gradient-to-r from-red-500 to-orange-600 bg-clip-text font-semibold text-transparent">
                  Amazing
                </span>{' '}
                Products Faster
              </motion.h2>
              <motion.p
                className="mb-4 w-[90%] text-gray-600 leading-[100%] dark:text-gray-300 md:w-[60%] lg:w-[80%] xl:mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                Streamline your development process with our powerful tools and intuitive interface. Get from idea to launch in record time with AI-powered assistance.
              </motion.p>
              <motion.div
                className="mb-8 flex gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="group flex h-12 items-center gap-2 rounded-lg bg-blue-600 px-4 text-lg text-white transition-colors"
                >
                  Get Started
                </button>
                <button
                  type="button"
                  onClick={handleWatchDemo}
                  className="group flex h-12 items-center gap-2 rounded-lg px-4 text-lg text-black dark:text-white"
                >
                  <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  Watch Demo
                </button>
              </motion.div>
              <motion.div
                className="flex items-center gap-8 text-sm text-gray-600 dark:text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 text-yellow-500" fill="currentColor" />
                    ))}
                  </div>
                  <span>4.9/5 rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>50k+ users</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
          <div className="-skew-x-12 overflow-hidden md:absolute md:top-0 md:h-[44rem] md:mt-0 md:[mask-image:radial-gradient(ellipse_80%_50%_at_100%_50%,#000_70%,transparent_110%)] 2xl:-right-52 xl:-right-72 sm:-right-80">
            <CpuArchitecture text="UI-Layouts" className="[mask-image:radial-gradient(ellipse_55%_50%_at_50%_50%,#000_70%,transparent_95%)]" />
            <div className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(135deg,#d6d6d6_0px_1px,transparent_1px_16px)] [mask-image:radial-gradient(ellipse_35%_50%_at_50%_50%,#000_70%,transparent_95%)] dark:bg-[repeating-linear-gradient(135deg,#131313_0px_1px,transparent_1px_16px)]" />
          </div>
        </div>
        <div className="relative px-4 py-5">
          <Marquee className="[--duration:20s]">
            {marqueeLogos.map((logo) => (
              <div key={logo.name} className="flex items-center px-8">
                <Image src={logo.src} alt={logo.name} width={144} height={144} className="w-20 md:w-36" />
              </div>
            ))}
          </Marquee>
          <ProgressiveBlur className="pointer-events-none absolute left-0 top-0 h-full w-[200px]" direction="left" blurIntensity={1} />
          <ProgressiveBlur className="pointer-events-none absolute right-0 top-0 h-full w-[200px]" direction="right" blurIntensity={1} />
        </div>
      </div>
    </section>
  );
}
