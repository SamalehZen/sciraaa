export default function BannedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-2">Compte suspendu</h1>
        <p className="text-muted-foreground mb-4">
          Votre compte a été suspendu par un administrateur. Si vous pensez qu’il s’agit d’une erreur, veuillez contacter le support.
        </p>
      </div>
    </div>
  );
}
