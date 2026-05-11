/** Point d’entrée dashboard mentor — liens utiles hackathon. */
export default function DashboardIndexPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold text-[var(--color-foreground)]">Dashboard mentor</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Création QCM IA : URL{" "}
        <code className="rounded bg-[var(--color-muted)] px-1 font-mono text-xs">
          /dashboard/modules/&lt;module_id&gt;/quizzes/new
        </code>{" "}
        (remplacer <code className="font-mono text-xs">module_id</code> par l’UUID d’un module de vos classes).
      </p>
    </div>
  );
}
