"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ExternalLink,
  Library,
  Minus,
  Plus,
  TriangleAlert,
  Users,
} from "lucide-react";

import { CharacterSheet } from "@/components/character-sheet/character-sheet";
import {
  CustomScriptPicker,
  customScriptsLabel,
} from "@/components/entry/custom-script-picker";
import { Button } from "@/components/ui/button";
import { isTeensyvillePreset } from "@/components/entry/script-presets";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { createGame, joinGame } from "@/lib/api";
import { toAppError } from "@/lib/app-error";
import { editions, type GameScript } from "@/lib/game-data";
import { normalizeGameCode } from "@/lib/game-code";
import { notify } from "@/lib/notifications";
import { trackEvent } from "@/lib/observability/client";
import { cn } from "@/lib/utils";

type EntryView = "cover" | "storytell" | "custom" | "join";
type InvitationIssue = "full" | "unavailable";

function CharacterReferenceLink({ className }: { className?: string }) {
  return (
    <Link href="/tb" className={cn("entry-character-sheets", className)}>
      <span className="entry-character-copy">
        <strong>Character Reference</strong>
        <small>Scripts &amp; Travellers</small>
      </span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}

export function EntryExperience({
  initialJoinCode = "",
  invitationUnavailable = false,
}: {
  initialJoinCode?: string;
  invitationUnavailable?: boolean;
}) {
  const router = useRouter();
  const normalizedInitialJoinCode = normalizeGameCode(initialJoinCode)
    .replace(/[^A-HJ-NP-Z2-9]/g, "")
    .slice(0, 6);
  const [view, setView] = useState<EntryView>(
    normalizedInitialJoinCode || invitationUnavailable ? "join" : "cover",
  );
  const [edition, setEdition] = useState<GameScript>("tb");
  const customScript = typeof edition === "object" ? edition : undefined;
  const [previewOpen, setPreviewOpen] = useState(false);
  const customScriptButton = useRef<HTMLButtonElement>(null);
  const previousView = useRef(view);
  useLayoutEffect(() => {
    if (previousView.current === "custom" && view === "storytell") {
      customScriptButton.current?.focus();
    }
    previousView.current = view;
  }, [view]);
  const [playerCount, setPlayerCount] = useState(7);
  const showPlayerHint =
    isTeensyvillePreset(customScript) && (playerCount < 5 || playerCount > 6);
  const [joinCode, setJoinCode] = useState(normalizedInitialJoinCode);
  const [playerName, setPlayerName] = useState("");
  const [pendingAction, setPendingAction] = useState<"create" | "join" | null>(
    null,
  );
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
  const [playerNameError, setPlayerNameError] = useState<string | null>(null);
  const [joinFormError, setJoinFormError] = useState<string | null>(null);
  const [invitationIssue, setInvitationIssue] =
    useState<InvitationIssue | null>(
      invitationUnavailable ? "unavailable" : null,
    );
  const createPending = pendingAction === "create";
  const joinPending = pendingAction === "join";
  const isInvitationRoute = Boolean(
    normalizedInitialJoinCode || invitationUnavailable,
  );
  const isInvitation = isInvitationRoute;
  const showBack =
    view === "storytell" ||
    view === "custom" ||
    (view === "join" && !isInvitation);

  function showView(nextView: EntryView) {
    if (pendingAction) return;
    if (nextView === "cover" && isInvitationRoute) {
      router.replace("/");
      return;
    }
    setView(nextView);
    setJoinCodeError(null);
    setPlayerNameError(null);
    setJoinFormError(null);
  }

  function showManualJoin() {
    if (pendingAction) return;
    router.push("/");
  }

  async function handleCreate() {
    if (pendingAction) return;
    setPendingAction("create");
    try {
      const result = await createGame(edition, playerCount);
      trackEvent("game_created", {
        actor_role: "storyteller",
        edition: typeof edition === "string" ? edition : "custom",
        player_count: playerCount,
      });
      router.push(`/game/${result.snapshot.game.joinCode}/storyteller`);
    } catch (cause) {
      setPendingAction(null);
      notify.appError(toAppError(cause, "Unable to create game."));
    }
  }

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    if (pendingAction) return;
    const codeError =
      joinCode.length === 6 ? null : "Enter a six-character game code.";
    const nameError = playerName.trim() ? null : "Enter your name.";
    setJoinCodeError(codeError);
    setPlayerNameError(nameError);
    setJoinFormError(null);
    if (codeError || nameError) return;

    setPendingAction("join");
    try {
      const result = await joinGame(joinCode, playerName);
      trackEvent("game_joined", { actor_role: "player" });
      router.push(
        `/game/${result.snapshot.game.joinCode}/player/${result.seatId}`,
      );
    } catch (cause) {
      setPendingAction(null);
      const error = toAppError(cause, "Unable to join game.");
      if (error.code === "not_found") {
        if (isInvitation) {
          setInvitationIssue("unavailable");
        } else {
          setJoinCodeError("Game not found. Check the code and try again.");
        }
      } else if (error.code === "no_open_seats") {
        if (isInvitation) {
          setInvitationIssue("full");
        } else {
          setJoinFormError(
            "This game has no open seats. Ask your storyteller before trying again.",
          );
        }
      } else {
        notify.appError(error);
      }
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
                <p className="entry-tagline">
                  An unofficial shared digital grimoire.
                </p>
              </header>

              <CharacterReferenceLink className="entry-character-sheets-desktop" />
            </div>
          </div>
        </section>

        <section
          className={cn(
            "entry-page entry-page-action",
            view === "custom" && "is-browsing-scripts",
          )}
        >
          <div className="entry-page-inner">
            <div
              className="entry-action-stage"
              onKeyDown={(event) => {
                if (view === "custom" && event.key === "Escape") {
                  event.preventDefault();
                  showView("storytell");
                }
              }}
            >
              {showBack ? (
                <button
                  type="button"
                  className="entry-back"
                  disabled={pendingAction !== null}
                  onClick={() =>
                    showView(view === "custom" ? "storytell" : "cover")
                  }
                >
                  <ArrowLeft aria-hidden="true" />
                  {view === "custom" ? "Back to setup" : "Back to game options"}
                </button>
              ) : null}

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
                    <h2 id="edition-title">Choose a script</h2>
                  </header>

                  <div className="entry-editions">
                    {editions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={createPending}
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

                  <div className="entry-custom-option">
                    {customScript && (
                      <div className="entry-script-selection">
                        <div className="min-w-0" role="status">
                          <strong className="block break-words">
                            {customScript.name}
                          </strong>
                          <span className="text-xs text-black/65">
                            {customScript.author && `${customScript.author} · `}
                            {customScript.roleIds.length} characters
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="quiet"
                          aria-haspopup="dialog"
                          disabled={createPending}
                          onClick={() => setPreviewOpen(true)}
                        >
                          <BookOpen aria-hidden="true" size={14} />
                          Preview sheet
                        </Button>
                        <Sheet
                          title="Script preview"
                          open={previewOpen}
                          onOpenChange={setPreviewOpen}
                        >
                          <CharacterSheet
                            sheetId={customScript}
                            className="min-h-0 flex-1"
                          />
                        </Sheet>
                      </div>
                    )}
                    <Button
                      ref={customScriptButton}
                      type="button"
                      size="lg"
                      variant="tinted"
                      className="w-full"
                      disabled={createPending}
                      onClick={() => showView("custom")}
                    >
                      <Library aria-hidden="true" size={16} />
                      {customScriptsLabel}
                      <ArrowRight aria-hidden="true" size={14} />
                    </Button>
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
                          disabled={createPending || playerCount <= 5}
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
                          aria-describedby={
                            showPlayerHint ? "teensyville-count" : undefined
                          }
                          className="entry-player-count-input"
                          value={playerCount}
                          disabled={createPending}
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
                          disabled={createPending || playerCount >= 20}
                          onClick={() =>
                            setPlayerCount((count) => Math.min(20, count + 1))
                          }
                        >
                          <Plus aria-hidden="true" />
                        </IconButton>
                      </div>
                    </div>
                    {showPlayerHint && (
                      <p
                        id="teensyville-count"
                        className="entry-player-warning"
                        role="status"
                      >
                        <TriangleAlert aria-hidden="true" size={16} />
                        <span>
                          This preset is designed for{" "}
                          <strong>5–6 players</strong>.
                        </span>
                      </p>
                    )}
                    <Button
                      size="lg"
                      className="entry-open-button"
                      onClick={handleCreate}
                      pending={createPending}
                      disabled={playerCount < 5 || playerCount > 20}
                    >
                      Open grimoire
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>
                </section>
              )}

              {view === "custom" && (
                <CustomScriptPicker
                  selected={customScript}
                  onSelect={(script, preview = false) => {
                    setEdition(script);
                    setPreviewOpen(preview);
                    showView("storytell");
                  }}
                />
              )}

              {view === "join" && (
                <section
                  className="entry-step join-step"
                  aria-labelledby="join-title"
                >
                  <header className="entry-step-heading">
                    <p>{isInvitation ? "Invitation" : "Player"}</p>
                    <h2 id="join-title">
                      {invitationIssue === "unavailable"
                        ? "Invitation unavailable"
                        : invitationIssue === "full"
                          ? "Game is full"
                          : isInvitation
                            ? "You’re invited"
                            : "Join a game"}
                    </h2>
                  </header>

                  {invitationIssue ? (
                    <div className="entry-invitation-status" aria-live="polite">
                      <p>
                        {invitationIssue === "full"
                          ? "This game has no open seats. Ask your storyteller before trying again."
                          : "This game may have ended, or the invitation link is no longer valid."}
                      </p>
                      <div className="entry-invitation-actions">
                        <Button size="lg" onClick={showManualJoin}>
                          Back to game options
                          <ArrowRight aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isInvitation ? (
                        <p className="entry-step-intro">
                          Enter your name to join the game.
                        </p>
                      ) : null}

                      <form onSubmit={handleJoin} className="entry-join-form">
                        <label>
                          <span>Game code</span>
                          <Input
                            value={joinCode}
                            onChange={
                              isInvitation
                                ? undefined
                                : (event) => {
                                    setJoinCodeError(null);
                                    setJoinFormError(null);
                                    setJoinCode(
                                      event.target.value
                                        .toUpperCase()
                                        .replace(/[^A-HJ-NP-Z2-9]/g, "")
                                        .slice(0, 6),
                                    );
                                  }
                            }
                            onBlur={
                              isInvitation
                                ? undefined
                                : () =>
                                    setJoinCodeError(
                                      joinCode.length > 0 &&
                                        joinCode.length !== 6
                                        ? "Enter a six-character game code."
                                        : null,
                                    )
                            }
                            placeholder="ABC123"
                            className="entry-code-input"
                            aria-invalid={joinCodeError ? true : undefined}
                            aria-describedby={
                              joinCodeError ? "join-code-error" : undefined
                            }
                            disabled={joinPending || isInvitation}
                            minLength={6}
                            maxLength={6}
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            autoFocus={!isInvitation}
                          />
                          {joinCodeError ? (
                            <span
                              id="join-code-error"
                              className="entry-field-error"
                            >
                              {joinCodeError}
                            </span>
                          ) : null}
                        </label>
                        <label>
                          <span>Your name</span>
                          <Input
                            value={playerName}
                            onChange={(event) => {
                              setPlayerNameError(null);
                              setJoinFormError(null);
                              setPlayerName(event.target.value);
                            }}
                            onBlur={() =>
                              setPlayerNameError(
                                playerName.length > 0 && !playerName.trim()
                                  ? "Enter your name."
                                  : null,
                              )
                            }
                            placeholder="Player name"
                            aria-invalid={playerNameError ? true : undefined}
                            aria-describedby={
                              playerNameError ? "player-name-error" : undefined
                            }
                            disabled={joinPending}
                            maxLength={40}
                            autoComplete="name"
                            autoFocus={isInvitation && !invitationIssue}
                          />
                          {playerNameError ? (
                            <span
                              id="player-name-error"
                              className="entry-field-error"
                            >
                              {playerNameError}
                            </span>
                          ) : null}
                        </label>
                        {joinFormError ? (
                          <p className="entry-form-error" role="alert">
                            {joinFormError}
                          </p>
                        ) : null}
                        <Button
                          type="submit"
                          size="lg"
                          pending={joinPending}
                          disabled={joinCode.length !== 6 || !playerName.trim()}
                        >
                          Join game
                          <ArrowRight aria-hidden="true" />
                        </Button>
                      </form>

                      {isInvitation ? (
                        <button
                          type="button"
                          className="entry-secondary-action entry-use-different-code"
                          onClick={showManualJoin}
                        >
                          Use a different code
                        </button>
                      ) : null}
                    </>
                  )}
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
            <Link href="/instructions" className="entry-project-instructions">
              Instructions
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/privacy" className="entry-project-privacy">
              Privacy
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
