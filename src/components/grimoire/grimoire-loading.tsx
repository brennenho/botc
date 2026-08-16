export function GrimoireLoading() {
  return (
    <main className="grimoire-loading-shell" aria-busy="true">
      <span className="sr-only" role="status" aria-live="polite">
        Loading game
      </span>
    </main>
  );
}
