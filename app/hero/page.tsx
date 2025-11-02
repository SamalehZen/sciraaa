'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Drawer } from 'vaul';
import { Sparkles, Search, Brain, ShieldCheck, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HyperLogo } from '@/components/logos/hyper-logo';

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  highlight: string;
};

type Metric = {
  value: string;
  label: string;
  detail: string;
};

type Highlight = {
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    title: 'Recherche orchestrée',
    highlight: 'Sources dynamiques',
    description:
      "Agrège vos bases de connaissances internes, le web professionnel et les API métiers pour restituer des réponses en contexte.",
    icon: Search,
  },
  {
    title: 'Raisonnement avancé',
    highlight: 'IA multi-agents',
    description:
      "L'IA de Hyper compose, compare et valide plusieurs pistes d'analyse pour fournir des recommandations actionnables.",
    icon: Brain,
  },
  {
    title: 'Confiance et contrôle',
    highlight: 'Gouvernance intégrée',
    description:
      'Trace chaque décision, sécurise les accès et applique vos politiques de conformité sans ralentir les équipes.',
    icon: ShieldCheck,
  },
];

const metrics: Metric[] = [
  {
    value: '10x',
    label: 'Décisions accélérées',
    detail: "Réduisez le temps de synthèse d'informations critiques.",
  },
  {
    value: '24/7',
    label: 'Veille automatisée',
    detail: 'Hyper surveille vos signaux clés en continu.',
  },
  {
    value: '15 min',
    label: 'Mise en route',
    detail: "Connectez vos données et déployez un copilote opérationnel.",
  },
];

const previewHighlights: Highlight[] = [
  {
    title: 'Veille collaborative',
    description: 'Identifiez et partagez instantanément les tendances importantes avec vos équipes.',
  },
  {
    title: 'Synthèses enrichies',
    description: "Obtenez des résumés multi-sources avec citations vérifiables et plans d'action.",
  },
  {
    title: 'Automations no-code',
    description: "Déclenchez des scénarios métiers pilotés par l'IA en quelques clics.",
  },
];

const activationSteps: Highlight[] = [
  {
    title: 'Connecter vos sources',
    description: 'Association sécurisée de vos bases internes, CRM, data lakes et fournisseurs externes.',
  },
  {
    title: 'Définir les garde-fous',
    description: 'Cadrez les rôles, les workflows de validation et les métriques de confiance en un tableau clair.',
  },
  {
    title: 'Activer les équipes',
    description: 'Diffusez les bonnes pratiques, scénarios types et programmes de formation adaptés à chaque métier.',
  },
];

export default function HeroPage() {
  const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background/70 to-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.2),_transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[32rem] bg-[radial-gradient(circle,_rgba(59,130,246,0.12),_transparent_65%)] blur-3xl" />
      </div>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-24 pt-20 sm:px-10 lg:px-12">
        <motion.header
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easing }}
          className="flex flex-col gap-10"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Sparkles className="size-3.5" />
                Lancement anticipé
              </Badge>
              <span className="text-sm text-muted-foreground">Hyper, le moteur stratégique de Capy, arrive très bientôt.</span>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="rounded-full border border-primary/40 bg-primary/10 p-4">
                  <HyperLogo className="size-10 text-primary" />
                </div>
                <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Hyper Intelligence Ops</span>
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: easing, delay: 0.1 }}
                className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl"
              >
                Orchestrer la connaissance. Accélérer la décision. Aligner toute l&apos;organisation autour de l&apos;IA.
              </motion.h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Une plateforme unifiée pour explorer, analyser et activer vos données avec une précision augmentée. Pensée pour les équipes
                data-driven, sécurisée pour l&apos;entreprise, et propulsée par les modèles IA les plus avancés.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link href="/">
                Lancer une recherche
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">Comparer les offres</Link>
            </Button>
            <PreviewDrawer />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easing, delay: 0.2 }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-lg shadow-primary/10 backdrop-blur"
              >
                <div className="text-3xl font-semibold text-foreground">{metric.value}</div>
                <div className="mt-2 text-sm font-medium text-muted-foreground/80">{metric.label}</div>
                <p className="mt-3 text-sm text-muted-foreground">{metric.detail}</p>
              </div>
            ))}
          </motion.div>
        </motion.header>
        <motion.section
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: easing, delay: 0.1 }}
          className="mt-20 grid gap-6 lg:grid-cols-3"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.75, ease: easing, delay: index * 0.08 }}
                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl shadow-primary/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-primary/80">{feature.highlight}</div>
                    <h3 className="mt-1 text-xl font-semibold text-foreground">{feature.title}</h3>
                  </div>
                </div>
                <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </motion.article>
            );
          })}
        </motion.section>
        <div className="mt-24">
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.85, ease: easing }}
            className="rounded-3xl border border-border/60 bg-card/70 p-10 shadow-2xl shadow-primary/10"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Préparez votre lancement</h2>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Paramétrez vos connecteurs, définissez vos garde-fous et mesurez l&apos;impact en continu. Hyper vous accompagne de la
                  gouvernance à l&apos;adoption terrain.
                </p>
              </div>
              <Drawer.Root>
                <Drawer.Trigger asChild>
                  <Button variant="secondary" size="lg">
                    Explorer le guide d&apos;activation
                  </Button>
                </Drawer.Trigger>
                <Drawer.Portal>
                  <Drawer.Overlay className="fixed inset-0 bg-background/60 backdrop-blur-sm" />
                  <Drawer.Content className="fixed inset-x-0 bottom-0 mt-24 flex max-h-[85vh] flex-col rounded-t-3xl border border-border/60 bg-background/95 shadow-[0_-30px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
                    <div className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-muted" />
                    <div className="px-6 pt-6">
                      <Badge variant="outline" className="px-2 py-1">
                        Guide d&apos;activation
                      </Badge>
                      <h3 className="mt-4 text-2xl font-semibold text-foreground">Trois étapes pour adopter Hyper</h3>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        Suivez ce parcours pour orchestrer vos données, définir vos politiques et livrer un copilote IA opérationnel à vos équipes.
                      </p>
                    </div>
                    <div className="mt-6 grid gap-4 px-6 pb-6 sm:grid-cols-3">
                      {activationSteps.map((step) => (
                        <div key={step.title} className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-lg shadow-primary/5">
                          <h4 className="text-base font-semibold text-foreground">{step.title}</h4>
                          <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6">
                      <p className="text-sm text-muted-foreground">
                        Besoin d&apos;aller plus loin ? Connectez-vous et activez un expert Capy dédié à votre vertical.
                      </p>
                      <Drawer.Close asChild>
                        <Button size="lg">Revenir à la page</Button>
                      </Drawer.Close>
                    </div>
                  </Drawer.Content>
                </Drawer.Portal>
              </Drawer.Root>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function PreviewDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <Button variant="ghost" size="lg">
          Voir un aperçu interactif
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-background/60 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 mt-24 flex max-h-[80vh] flex-col rounded-t-3xl border border-border/60 bg-background/95 shadow-[0_-30px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-muted" />
          <div className="px-6 pt-6">
            <Badge variant="outline" className="px-2 py-1">
              Aperçu produit
            </Badge>
            <h3 className="mt-4 text-2xl font-semibold text-foreground">Une salle de contrôle alimentée par l&apos;IA</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Inspectez comment Hyper combine les flux de signaux, génère des recommandations et déclenche des actions de suivi sans friction.
            </p>
          </div>
          <div className="mt-6 grid gap-4 px-6 pb-6 sm:grid-cols-3">
            {previewHighlights.map((highlight) => (
              <div key={highlight.title} className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-lg shadow-primary/5">
                <h4 className="text-base font-semibold text-foreground">{highlight.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{highlight.description}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6">
            <p className="text-sm text-muted-foreground">
              Prêt à tester ? Connectez vos sources et invitez vos équipes directement depuis le tableau de bord.
            </p>
            <Drawer.Close asChild>
              <Button size="lg">Fermer l&apos;aperçu</Button>
            </Drawer.Close>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
