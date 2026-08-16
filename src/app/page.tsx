"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ExternalLink,
  Minus,
  Plus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { createGame, joinGame } from "@/lib/api";
import { editions, type EditionId } from "@/lib/game-data";
import { cn } from "@/lib/utils";

type EntryView = "cover" | "storytell" | "join";

function CharacterReferenceLink({ className }: { className?: string }) {
  return (
    <Link href="/tb" className={cn("entry-character-sheets", className)}>
      <span className="entry-character-copy">
        <strong>Character Reference</strong>
        <small>Browse all editions</small>
      </span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [view, setView] = useState<EntryView>("cover");
  const [edition, setEdition] = useState<EditionId>("tb");
  const [playerCount, setPlayerCount] = useState(7);
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function showView(nextView: EntryView) {
    setView(nextView);
    setError(null);
  }

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const result = await createGame(edition, playerCount);
      router.push(`/game/${result.snapshot.game.joinCode}/storyteller`);
    } catch (cause) {
      setBusy(false);
      setError(
        cause instanceof Error ? cause.message : "Unable to create game.",
      );
    }
  }

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await joinGame(joinCode, playerName);
      router.push(
        `/game/${result.snapshot.game.joinCode}/player/${result.seatId}`,
      );
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "Unable to join game.");
    }
  }

  return (
    <main className="entry-cover min-h-svh">
      <div className="entry-leather" aria-hidden="true" />
      <div className={cn("entry-book", view !== "cover" && "is-active")}>
        <section className="entry-page entry-page-intro">
          <div className="entry-page-inner">
            <div className="entry-intro-content">
              <header className="entry-brand">
                <h1 className="entry-wordmark">
                  <span>Blood on the</span>
                  <span>Clocktower</span>
                </h1>
              </header>

              <CharacterReferenceLink className="entry-character-sheets-desktop" />
            </div>
          </div>
        </section>

        <section className="entry-page entry-page-action">
          <div className="entry-page-inner">
            <div className="entry-action-stage">
              {view !== "cover" && (
                <button
                  type="button"
                  className="entry-back"
                  onClick={() => showView("cover")}
                >
                  <ArrowLeft aria-hidden="true" />
                  Back to game options
                </button>
              )}

              {view === "cover" && (
                <section
                  className="entry-threshold"
                  aria-labelledby="entry-action-title"
                >
                  <header className="entry-action-heading">
                    <h2 id="entry-action-title">Enter the game</h2>
                  </header>

                  <div className="entry-actions" aria-label="Choose game mode">
                    <button
                      type="button"
                      className="entry-action"
                      onClick={() => showView("storytell")}
                    >
                      <BookOpen aria-hidden="true" />
                      <span>
                        <strong>Storyteller</strong>
                        <small>Start and manage a new game</small>
                      </span>
                      <ArrowRight
                        className="entry-action-arrow"
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      className="entry-action"
                      onClick={() => showView("join")}
                    >
                      <Users aria-hidden="true" />
                      <span>
                        <strong>Player</strong>
                        <small>Join with your storyteller’s game code</small>
                      </span>
                      <ArrowRight
                        className="entry-action-arrow"
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <CharacterReferenceLink className="entry-character-sheets-mobile" />
                </section>
              )}

              {view === "storytell" && (
                <section
                  className="entry-step edition-step"
                  aria-labelledby="edition-title"
                >
                  <header className="entry-step-heading">
                    <p>Start a new game</p>
                    <h2 id="edition-title">Choose an edition</h2>
                  </header>

                  <div className="entry-editions">
                    {editions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={edition === item.id}
                        onClick={() => setEdition(item.id)}
                        className={cn(
                          "entry-edition",
                          edition === item.id && "is-selected",
                        )}
                      >
                        <span className="entry-edition-art">
                          <Image
                            src={item.logoPath}
                            alt=""
                            fill
                            priority
                            sizes="(max-width: 720px) 28vw, 150px"
                          />
                        </span>
                        <strong>{item.name}</strong>
                      </button>
                    ))}
                  </div>

                  <div className="entry-step-action">
                    <div className="entry-player-count">
                      <span className="entry-player-count-label">
                        <Users aria-hidden="true" />
                        Players
                      </span>
                      <div className="entry-player-stepper">
                        <IconButton
                          label="Remove a Player"
                          size="sm"
                          variant="quiet"
                          disabled={playerCount <= 5}
                          onClick={() =>
                            setPlayerCount((count) => Math.max(5, count - 1))
                          }
                        >
                          <Minus aria-hidden="true" />
                        </IconButton>
                        <Input
                          type="number"
                          min={5}
                          max={20}
                          inputMode="numeric"
                          aria-label="Player Count"
                          className="entry-player-count-input"
                          value={playerCount}
                          onFocus={(event) => event.currentTarget.select()}
                          onChange={(event) => {
                            const count = event.currentTarget.valueAsNumber;
                            if (Number.isNaN(count)) return;
                            setPlayerCount(Math.round(count));
                          }}
                          onBlur={() =>
                            setPlayerCount((count) =>
                              Math.min(20, Math.max(5, count)),
                            )
                          }
                        />
                        <IconButton
                          label="Add a Player"
                          size="sm"
                          variant="quiet"
                          disabled={playerCount >= 20}
                          onClick={() =>
                            setPlayerCount((count) => Math.min(20, count + 1))
                          }
                        >
                          <Plus aria-hidden="true" />
                        </IconButton>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="entry-open-button"
                      onClick={handleCreate}
                      disabled={busy || playerCount < 5 || playerCount > 20}
                    >
                      {busy ? "Opening..." : "Open grimoire"}
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>
                </section>
              )}

              {view === "join" && (
                <section
                  className="entry-step join-step"
                  aria-labelledby="join-title"
                >
                  <header className="entry-step-heading">
                    <p>Player</p>
                    <h2 id="join-title">Join a game</h2>
                  </header>

                  <form onSubmit={handleJoin} className="entry-join-form">
                    <label>
                      <span>Game code</span>
                      <Input
                        value={joinCode}
                        onChange={(event) =>
                          setJoinCode(
                            event.target.value
                              .toUpperCase()
                              .replace(/[^A-HJ-NP-Z2-9]/g, "")
                              .slice(0, 6),
                          )
                        }
                        placeholder="ABC123"
                        className="entry-code-input"
                        minLength={6}
                        maxLength={6}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        autoFocus
                      />
                    </label>
                    <label>
                      <span>Your name</span>
                      <Input
                        value={playerName}
                        onChange={(event) => setPlayerName(event.target.value)}
                        placeholder="Player name"
                        maxLength={40}
                        autoComplete="name"
                      />
                    </label>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={
                        busy || joinCode.length !== 6 || !playerName.trim()
                      }
                    >
                      {busy ? "Joining..." : "Join game"}
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </form>
                </section>
              )}
            </div>
          </div>
        </section>

        <footer className="entry-community">
          <Image
            src="/assets/community/ccc-parchment.png"
            alt="Community Created Content"
            width={132}
            height={50}
            className="entry-ccc"
          />
          <p>
            An unofficial community project, not affiliated with The Pandemonium
            Institute. Blood on the Clocktower is a trademark of Steven Medway
            and The Pandemonium Institute.
          </p>
        </footer>

        <footer className="entry-project-footer">
          <p className="entry-project-credit">
            A project by{" "}
            <a
              className="entry-author-link"
              href="https://brennen.dev"
              target="_blank"
              rel="noreferrer"
            >
              Brennen Ho
            </a>
            .
          </p>
          <nav className="entry-project-links" aria-label="Project links">
            <a
              className="entry-project-github"
              href="https://github.com/brennenho/botc"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
              <ExternalLink aria-hidden="true" />
            </a>
            <span aria-hidden="true">·</span>
            <Link href="/privacy" className="entry-project-privacy">
              Privacy
            </Link>
          </nav>
        </footer>
      </div>

      {error && (
        <div className="home-error" role="alert">
          {error}
        </div>
      )}
    </main>
  );
}
