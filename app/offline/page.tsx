export default function OfflinePage() {
  return (
    <main className="min-h-dvh w-full flex items-center justify-center bg-background text-foreground px-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-6 shadow-xl">
        <div className="text-2xl font-semibold tracking-tight">Vous êtes hors ligne</div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          La connexion semble indisponible. Vos contenus déjà consultés restent accessibles dans l’application.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Réessayer
          </a>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border/60 px-4 text-sm font-medium"
          >
            Accueil
          </a>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">Astuce: si vous avez installé l’app, relancez-la une fois en ligne pour synchroniser.</div>
      </div>
    </main>
  );
}
