"use client";

import Image from "next/image";
import {
  Archive,
  ChevronDown,
  CirclePlus,
  Copy,
  Moon,
  RefreshCcw,
  Skull,
  Sparkles,
  Sun,
  Vote,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  editions,
  getDefaultAlignment,
  getEdition,
  getEditionRoles,
  getNightOrder,
  getRolesByTeam,
  getSetupWarnings,
  roleById,
  teamLabel,
  type EditionId,
  type Phase,
  type Team,
} from "@/lib/game-data";
import type {
  GameToken,
  PlayerSnapshot,
  Seat,
  StorytellerSnapshot,
} from "@/lib/game-data/types";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type View =
  | { name: "home" }
  | { name: "storyteller"; token: string; snapshot: StorytellerSnapshot }
  | { name: "player"; token: string; seatId: string; snapshot: PlayerSnapshot };

const teamOrder: Team[] = [
  "townsfolk",
  "outsider",
  "minion",
  "demon",
  "traveller",
];

const reminderPresets = ["Drunk", "Poisoned", "Safe", "Dead", "No Ability"];

export function GameApp() {
  const [view, setView] = useState<View>({ name: "home" });
  const [edition, setEdition] = useState<EditionId>("tb");
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const gameId = params.get("game");
    const seatId = params.get("seat");
    const isStoryteller = params.get("st") === "1";

    if (code) setJoinCode(code.toUpperCase());

    async function restoreView() {
      if (!gameId) return;

      if (isStoryteller) {
        const response = await fetch(`/api/storyteller?gameId=${gameId}`);
        const data = (await response.json()) as
          | { snapshot: StorytellerSnapshot }
          | { error: string };

        if (response.ok && "snapshot" in data) {
          setView({ name: "storyteller", token: "", snapshot: data.snapshot });
        }
        return;
      }

      if (seatId) {
        const response = await fetch(
          `/api/player?gameId=${gameId}&seatId=${seatId}`,
        );
        const data = (await response.json()) as
          | { snapshot: PlayerSnapshot }
          | { error: string };

        if (response.ok && "snapshot" in data) {
          setView({ name: "player", token: "", seatId, snapshot: data.snapshot });
        }
      }
    }

    void restoreView();
  }, []);

  async function createStorytellerGame() {
    setIsBusy(true);
    setError(null);

    const response = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edition }),
    });
    const data = (await response.json()) as
      | { storytellerToken: string; snapshot: StorytellerSnapshot }
      | { error: string };
    setIsBusy(false);

    if (!response.ok || "error" in data) {
      setError("error" in data ? data.error : "Unable to create game.");
      return;
    }

    setView({
      name: "storyteller",
      token: data.storytellerToken,
      snapshot: data.snapshot,
    });
    window.history.replaceState(
      null,
      "",
      `?game=${data.snapshot.game.id}&st=1`,
    );
  }

  async function joinPlayerGame() {
    setIsBusy(true);
    setError(null);

    const response = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode, playerName }),
    });
    const data = (await response.json()) as
      | { playerToken: string; seatId: string; snapshot: PlayerSnapshot }
      | { error: string };
    setIsBusy(false);

    if (!response.ok || "error" in data) {
      setError("error" in data ? data.error : "Unable to join game.");
      return;
    }

    setView({
      name: "player",
      token: data.playerToken,
      seatId: data.seatId,
      snapshot: data.snapshot,
    });
    window.history.replaceState(
      null,
      "",
      `?game=${data.snapshot.game.id}&seat=${data.seatId}`,
    );
  }

  if (view.name === "storyteller") return <StorytellerView view={view} />;
  if (view.name === "player") return <PlayerView setView={setView} view={view} />;

  return (
    <main className="min-h-screen bg-[#191919] text-[#f1f1ef]">
      <div className="mx-auto grid min-h-screen max-w-[1480px] grid-cols-1 gap-6 px-4 py-5 sm:px-6 min-[1050px]:grid-cols-[1fr_420px]">
        <section className="parchment-panel flex min-h-[calc(100vh-2.5rem)] flex-col justify-between gap-10 p-5 sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <Badge variant="outline" className="border-[#9b784e]/40 bg-[#fff8df]/70 text-[#6f1d26]">
                Online Grimoire
              </Badge>
              <h1 className="mt-4 max-w-4xl text-[42px] leading-[1.05] font-bold tracking-normal text-[#25170f] sm:text-[64px]">
                Blood on the Clocktower
              </h1>
              <p className="mt-4 max-w-2xl text-[16px] leading-[1.55] font-medium text-[#594431]">
                A clean, parchment-warm grimoire for Storytellers and private
                friend tables.
              </p>
            </div>
            <Image
              alt="Community Created Content"
              className="h-auto w-32 rounded-sm"
              height={190}
              src="/assets/community/ccc-parchment.png"
              width={420}
              priority
            />
          </header>

          <div className="grid max-w-5xl gap-3 sm:grid-cols-3">
            {editions.map((script) => (
              <button
                className={cn(
                  "edition-card rounded-lg border bg-[#fff8df]/65 p-4 text-left shadow-custom transition-colors hover:bg-[#fff8df]/85",
                  edition === script.id &&
                    "border-[#6f1d26]/70 bg-[#fff8df] ring-2 ring-[#6f1d26]/20",
                )}
                key={script.id}
                onClick={() => setEdition(script.id)}
                type="button"
              >
                <Image
                  alt=""
                  className="mx-auto h-20 w-auto object-contain"
                  height={120}
                  src={script.logoPath}
                  width={220}
                />
                <span className="mt-4 block text-[17px] font-bold text-[#25170f]">
                  {script.name}
                </span>
                <span className="mt-2 block text-sm leading-5 text-[#6a5848]">
                  {script.tone}
                </span>
              </button>
            ))}
          </div>

          <p className="max-w-3xl text-sm leading-6 text-[#6a5848]">
            This is an unofficial, non-commercial community tool for friend
            groups. Blood on the Clocktower and official assets are owned by The
            Pandemonium Institute and are used under the Community Created
            Content policy.
          </p>
        </section>

        <Card className="self-center border-[#333332] bg-[#202020] text-[#f1f1ef]">
          <CardHeader>
            <CardTitle className="text-2xl">Start a table</CardTitle>
            <CardDescription className="text-[#b8b8b5]">
              Create a Storyteller grimoire, then share the join code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button
              className="w-full bg-[#1f432f] text-[#f4f4f2] hover:bg-[#28543c]"
              disabled={isBusy}
              onClick={createStorytellerGame}
            >
              <Sparkles />
              Create {getEdition(edition).shortName}
            </Button>

            <Separator className="bg-[#333332]" />

            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">Join as player</h2>
                <p className="mt-1 text-sm text-[#b8b8b5]">
                  Players only see their own role and status.
                </p>
              </div>
              <Field label="Code">
                <Input
                  className="uppercase"
                  maxLength={8}
                  onChange={(event) => setJoinCode(event.target.value)}
                  placeholder="ABC123"
                  value={joinCode}
                />
              </Field>
              <Field label="Name">
                <Input
                  maxLength={40}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Your seat name"
                  value={playerName}
                />
              </Field>
              <Button
                className="w-full"
                disabled={isBusy || !joinCode || !playerName}
                onClick={joinPlayerGame}
                variant="secondary"
              >
                Join table
              </Button>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function StorytellerView({
  view,
}: {
  view: Extract<View, { name: "storyteller" }>;
}) {
  const [snapshot, setSnapshot] = useState(view.snapshot);
  const [selectedSeatId, setSelectedSeatId] = useState(
    view.snapshot.seats[0]?.id ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedSeat = snapshot.seats.find((seat) => seat.id === selectedSeatId);
  const warnings = useMemo(
    () => getSetupWarnings(snapshot.seats),
    [snapshot.seats],
  );
  const rolesByTeam = getRolesByTeam(snapshot.game.edition);

  function updateSeat(seatId: string, update: Partial<Seat>) {
    setSnapshot((current) => ({
      ...current,
      seats: current.seats.map((seat) =>
        seat.id === seatId ? { ...seat, ...update } : seat,
      ),
    }));
  }

  function addSeat() {
    setSnapshot((current) => {
      const now = new Date().toISOString();
      const seat: Seat = {
        id: crypto.randomUUID(),
        gameId: current.game.id,
        seatIndex: current.seats.length,
        playerName: `Player ${current.seats.length + 1}`,
        roleId: null,
        alignment: "good",
        alive: true,
        ghostVoteAvailable: true,
        isTraveller: false,
        joinedAt: now,
      };

      setSelectedSeatId(seat.id);
      return { ...current, seats: [...current.seats, seat] };
    });
  }

  function assignRole(seatId: string, roleId: string) {
    const role = roleById.get(roleId);
    updateSeat(seatId, {
      roleId: role?.id ?? null,
      alignment: role ? getDefaultAlignment(role) : "good",
      isTraveller: role?.team === "traveller",
    });
  }

  function addReminder(seatId: string, label: string) {
    setSnapshot((current) => ({
      ...current,
      gameTokens: [
        ...current.gameTokens,
        {
          id: crypto.randomUUID(),
          gameId: current.game.id,
          seatId,
          tokenType: "reminder",
          roleId: null,
          label,
          position: current.gameTokens.length,
          metadata: {},
        },
      ],
    }));
  }

  function removeReminder(tokenId: string) {
    setSnapshot((current) => ({
      ...current,
      gameTokens: current.gameTokens.filter((token) => token.id !== tokenId),
    }));
  }

  async function saveGame(nextSnapshot = snapshot) {
    setIsSaving(true);
    setSaveError(null);

    const response = await fetch("/api/storyteller", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: nextSnapshot.game.id,
        token: view.token,
        phase: nextSnapshot.game.phase,
        dayNumber: nextSnapshot.game.dayNumber,
        status: nextSnapshot.game.status,
        seats: nextSnapshot.seats,
        gameTokens: nextSnapshot.gameTokens,
      }),
    });
    const data = (await response.json()) as
      | { snapshot: StorytellerSnapshot }
      | { error: string };
    setIsSaving(false);

    if (!response.ok || "error" in data) {
      setSaveError("error" in data ? data.error : "Unable to save.");
      return;
    }

    setSnapshot(data.snapshot);
  }

  const refreshGame = useCallback(async () => {
    const tokenParam = view.token ? `&token=${view.token}` : "";
    const response = await fetch(
      `/api/storyteller?gameId=${snapshot.game.id}${tokenParam}`,
    );
    const data = (await response.json()) as
      | { snapshot: StorytellerSnapshot }
      | { error: string };

    if (response.ok && "snapshot" in data) setSnapshot(data.snapshot);
  }, [snapshot.game.id, view.token]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel(`game-version-${snapshot.game.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `id=eq.${snapshot.game.id}`,
          schema: "public",
          table: "games",
        },
        () => {
          void refreshGame();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshGame, snapshot.game.id]);

  const joinUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}?code=${snapshot.game.joinCode}`;

  return (
    <main className="min-h-screen bg-[#191919] p-3 text-[#f1f1ef] sm:p-5">
      <div className="mx-auto grid max-w-[1800px] gap-4 xl:grid-cols-[1fr_380px]">
        <section className="grimoire-shell min-h-[760px] p-4 sm:p-6">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge variant="outline" className="border-[#6f1d26]/30 bg-[#fff8df]/65 text-[#6f1d26]">
                Storyteller Grimoire
              </Badge>
              <h1 className="mt-2 text-2xl font-bold text-[#25170f] sm:text-4xl">
                {getEdition(snapshot.game.edition).name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => void navigator.clipboard.writeText(joinUrl)}
                size="icon"
                title="Copy join link"
                variant="outline"
              >
                <Copy />
              </Button>
              <Button
                onClick={() => void refreshGame()}
                size="icon"
                title="Refresh"
                variant="outline"
              >
                <RefreshCcw />
              </Button>
              <Button disabled={isSaving} onClick={() => void saveGame()}>
                Save
              </Button>
            </div>
          </header>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <Badge className="bg-[#25170f] px-3 py-1.5 text-[#fff8df]">
              Code {snapshot.game.joinCode}
            </Badge>
            <PhaseButton
              current={snapshot.game.phase}
              icon={<Sun className="size-4" />}
              label="Day"
              phase="day"
              setSnapshot={setSnapshot}
            />
            <PhaseButton
              current={snapshot.game.phase}
              icon={<Moon className="size-4" />}
              label="Night"
              phase="night"
              setSnapshot={setSnapshot}
            />
            <Button
              onClick={() =>
                setSnapshot((current) => ({
                  ...current,
                  game: {
                    ...current.game,
                    dayNumber: current.game.dayNumber + 1,
                  },
                }))
              }
              size="sm"
              variant="outline"
            >
              Day {snapshot.game.dayNumber}
            </Button>
            <Button
              onClick={() => {
                const next = {
                  ...snapshot,
                  game: { ...snapshot.game, status: "archived" as const },
                };
                setSnapshot(next);
                void saveGame(next);
              }}
              size="sm"
              variant="outline"
            >
              <Archive />
              Archive
            </Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(620px,1fr)_340px]">
            <div className="town-square">
              <div className="town-center">
                <Image
                  alt=""
                  className="mx-auto h-24 w-auto opacity-90"
                  height={130}
                  src={getEdition(snapshot.game.edition).logoPath}
                  width={230}
                  priority
                />
                <p className="mt-3 text-sm font-medium text-[#6a5848]">
                  {snapshot.seats.filter((seat) => !seat.isTraveller).length}{" "}
                  residents ·{" "}
                  {snapshot.seats.filter((seat) => seat.isTraveller).length}{" "}
                  travellers
                </p>
              </div>
              {snapshot.seats.map((seat, index) => (
                <SeatToken
                  gameTokens={snapshot.gameTokens}
                  index={index}
                  isSelected={seat.id === selectedSeatId}
                  key={seat.id}
                  onClick={() => setSelectedSeatId(seat.id)}
                  seat={seat}
                  total={snapshot.seats.length}
                />
              ))}
            </div>

            <Card className="border-[#d8c18e] bg-[#fff8df]/80 text-[#25170f]">
              <CardContent className="space-y-4">
                {selectedSeat ? (
                  <SeatEditor
                    addReminder={addReminder}
                    assignRole={assignRole}
                    edition={snapshot.game.edition}
                    gameTokens={snapshot.gameTokens}
                    removeReminder={removeReminder}
                    seat={selectedSeat}
                    updateSeat={updateSeat}
                  />
                ) : (
                  <p className="text-sm text-[#6a5848]">Select a seat.</p>
                )}
                <Button className="w-full" onClick={addSeat} variant="outline">
                  <CirclePlus />
                  Add seat
                </Button>
              </CardContent>
            </Card>
          </div>

          {saveError ? (
            <p className="mt-4 text-sm text-destructive">{saveError}</p>
          ) : null}
        </section>

        <aside className="space-y-4">
          <Panel title="Setup warnings">
            {warnings.length > 0 ? (
              <ul className="space-y-2 text-sm leading-5 text-[#8a1f2b]">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#6a5848]">Counts look steady.</p>
            )}
          </Panel>

          <Panel title="Night order">
            <div className="grid gap-3 text-sm">
              {(["first", "other"] as const).map((night) => (
                <Disclosure
                  key={night}
                  open={night === "first"}
                  title={night === "first" ? "First night" : "Other nights"}
                >
                  <ol className="mt-3 space-y-2">
                    {getNightOrder(snapshot.game.edition, night).map((role) => (
                      <li
                        className="flex items-center gap-2"
                        key={`${night}-${role.id}`}
                      >
                        <Image alt="" height={28} src={role.imagePath} width={28} />
                        <span>{role.name}</span>
                      </li>
                    ))}
                  </ol>
                </Disclosure>
              ))}
            </div>
          </Panel>

          <Panel title="Script">
            <div className="space-y-3">
              {teamOrder.map((team) => (
                <Disclosure
                  key={team}
                  open={team !== "traveller"}
                  title={teamLabel(team)}
                >
                  <div className="mt-3 space-y-2">
                    {rolesByTeam[team].map((role) => (
                      <RoleLine key={role.id} roleId={role.id} />
                    ))}
                  </div>
                </Disclosure>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

function PlayerView({
  setView,
  view,
}: {
  setView: (view: View) => void;
  view: Extract<View, { name: "player" }>;
}) {
  const [snapshot, setSnapshot] = useState(view.snapshot);
  const role = snapshot.seat.roleId ? roleById.get(snapshot.seat.roleId) : null;
  const groups = getRolesByTeam(snapshot.game.edition);

  const refresh = useCallback(async () => {
    const tokenParam = view.token ? `&token=${view.token}` : "";
    const response = await fetch(
      `/api/player?gameId=${snapshot.game.id}&seatId=${view.seatId}${tokenParam}`,
    );
    const data = (await response.json()) as
      | { snapshot: PlayerSnapshot }
      | { error: string };

    if (response.ok && "snapshot" in data) setSnapshot(data.snapshot);
  }, [snapshot.game.id, view.seatId, view.token]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel(`game-version-${snapshot.game.id}-${view.seatId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `id=eq.${snapshot.game.id}`,
          schema: "public",
          table: "games",
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, snapshot.game.id, view.seatId]);

  return (
    <main className="min-h-screen bg-[#191919] p-4 text-[#f1f1ef] sm:p-6">
      <div className="parchment-panel mx-auto max-w-6xl p-5 sm:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="outline" className="border-[#6f1d26]/30 bg-[#fff8df]/70 text-[#6f1d26]">
              Player View
            </Badge>
            <h1 className="mt-2 text-3xl font-bold text-[#25170f]">
              {snapshot.seat.playerName}
            </h1>
          </div>
          <Button onClick={() => void refresh()} size="icon" variant="outline">
            <RefreshCcw />
          </Button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <Card className="border-[#d8c18e] bg-[#fff8df]/80 text-center text-[#25170f]">
            <CardContent>
              {role ? (
                <>
                  <Image
                    alt=""
                    className="mx-auto h-44 w-44 object-contain drop-shadow-xl"
                    height={220}
                    src={role.imagePath}
                    width={220}
                    priority
                  />
                  <h2 className="mt-4 text-3xl font-bold">{role.name}</h2>
                  <p className="mt-1 text-sm font-semibold tracking-[0.18em] text-[#6a5848] uppercase">
                    {snapshot.seat.alignment} · {teamLabel(role.team)}
                  </p>
                  <p className="mt-5 text-lg leading-7">{role.ability}</p>
                </>
              ) : (
                <p className="text-sm text-[#6a5848]">
                  Your Storyteller has not assigned your character yet.
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                <StatusPill active={snapshot.seat.alive} label="Alive" />
                <StatusPill
                  active={snapshot.seat.ghostVoteAvailable}
                  label="Ghost vote"
                />
              </div>
            </CardContent>
          </Card>

          <Panel title={`${getEdition(snapshot.game.edition).name} script`}>
            <div className="grid gap-4 md:grid-cols-2">
              {teamOrder.map((team) => (
                <div key={team}>
                  <h3 className="mb-2 text-sm font-bold tracking-[0.18em] text-[#6f1d26] uppercase">
                    {teamLabel(team)}
                  </h3>
                  <div className="space-y-2">
                    {groups[team].map((scriptRole) => (
                      <RoleLine key={scriptRole.id} roleId={scriptRole.id} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Button
          className="mt-6 text-[#594431]"
          onClick={() => setView({ name: "home" })}
          variant="link"
        >
          Back home
        </Button>
      </div>
    </main>
  );
}

function SeatToken({
  gameTokens,
  index,
  isSelected,
  onClick,
  seat,
  total,
}: {
  gameTokens: GameToken[];
  index: number;
  isSelected: boolean;
  onClick: () => void;
  seat: Seat;
  total: number;
}) {
  const role = seat.roleId ? roleById.get(seat.roleId) : null;
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const x = 50 + Math.cos(angle) * 38;
  const y = 50 + Math.sin(angle) * 38;
  const reminders = gameTokens.filter((token) => token.seatId === seat.id);

  return (
    <button
      className={cn(
        "seat-token",
        isSelected && "is-selected",
        !seat.alive && "is-dead",
      )}
      onClick={onClick}
      style={{ left: `${x}%`, top: `${y}%` }}
      type="button"
    >
      <span className="seat-art">
        {role ? (
          <Image alt="" height={82} src={role.imagePath} width={82} />
        ) : (
          <span className="empty-role" />
        )}
      </span>
      <span className="seat-name">{seat.playerName}</span>
      <span className="seat-role">{role?.name ?? "Unassigned"}</span>
      <span className="seat-flags">
        {!seat.alive ? <Skull className="size-3.5" /> : null}
        {seat.ghostVoteAvailable ? <Vote className="size-3.5" /> : null}
        {seat.isTraveller ? "T" : null}
      </span>
      {reminders.length > 0 ? (
        <span className="reminder-stack">
          {reminders.slice(0, 3).map((reminder) => (
            <span key={reminder.id}>{reminder.label}</span>
          ))}
        </span>
      ) : null}
    </button>
  );
}

function SeatEditor({
  addReminder,
  assignRole,
  edition,
  gameTokens,
  removeReminder,
  seat,
  updateSeat,
}: {
  addReminder: (seatId: string, label: string) => void;
  assignRole: (seatId: string, roleId: string) => void;
  edition: EditionId;
  gameTokens: GameToken[];
  removeReminder: (tokenId: string) => void;
  seat: Seat;
  updateSeat: (seatId: string, update: Partial<Seat>) => void;
}) {
  const currentRole = seat.roleId ? roleById.get(seat.roleId) : null;
  const roles = getEditionRoles(edition);
  const reminders = gameTokens.filter((token) => token.seatId === seat.id);

  return (
    <>
      <Field label="Seat name">
        <Input
          onChange={(event) =>
            updateSeat(seat.id, { playerName: event.target.value })
          }
          value={seat.playerName}
        />
      </Field>

      <Field label="Character">
        <Select
          onChange={(event) => assignRole(seat.id, event.target.value)}
          value={seat.roleId ?? ""}
        >
          <option value="">Unassigned</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {teamLabel(role.team)} · {role.name}
            </option>
          ))}
        </Select>
      </Field>

      {currentRole ? (
        <div className="rounded-md border bg-[#fffdf4]/70 p-3 text-sm leading-5 text-[#25170f]">
          <div className="mb-2 flex items-center gap-2">
            <Image alt="" height={42} src={currentRole.imagePath} width={42} />
            <div>
              <p className="font-semibold">{currentRole.name}</p>
              <p className="text-xs tracking-[0.18em] text-[#6a5848] uppercase">
                {teamLabel(currentRole.team)}
              </p>
            </div>
          </div>
          {currentRole.ability}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <ToggleButton
          active={seat.alive}
          label="Alive"
          onClick={() => updateSeat(seat.id, { alive: !seat.alive })}
        />
        <ToggleButton
          active={seat.ghostVoteAvailable}
          label="Ghost vote"
          onClick={() =>
            updateSeat(seat.id, {
              ghostVoteAvailable: !seat.ghostVoteAvailable,
            })
          }
        />
        <ToggleButton
          active={seat.alignment === "good"}
          label="Good"
          onClick={() => updateSeat(seat.id, { alignment: "good" })}
        />
        <ToggleButton
          active={seat.alignment === "evil"}
          label="Evil"
          onClick={() => updateSeat(seat.id, { alignment: "evil" })}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-[#25170f]">Reminders</p>
        <div className="mb-2 flex flex-wrap gap-2">
          {reminderPresets.map((label) => (
            <Button
              key={label}
              onClick={() => addReminder(seat.id, label)}
              size="sm"
              variant="outline"
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {reminders.map((reminder) => (
            <Badge
              className="cursor-pointer bg-[#25170f] text-[#fff8df]"
              key={reminder.id}
              onClick={() => removeReminder(reminder.id)}
            >
              {reminder.label}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}

function PhaseButton({
  current,
  icon,
  label,
  phase,
  setSnapshot,
}: {
  current: Phase;
  icon: ReactNode;
  label: string;
  phase: Phase;
  setSnapshot: Dispatch<SetStateAction<StorytellerSnapshot>>;
}) {
  return (
    <Button
      onClick={() =>
        setSnapshot((snapshot) => ({
          ...snapshot,
          game: { ...snapshot.game, phase },
        }))
      }
      size="sm"
      variant={current === phase ? "default" : "outline"}
    >
      {icon}
      {label}
    </Button>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card className="border-[#d8c18e] bg-[#fff8df]/86 text-[#25170f]">
      <CardHeader className="pb-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Disclosure({
  children,
  open,
  title,
}: {
  children: ReactNode;
  open?: boolean;
  title: string;
}) {
  return (
    <details className="rounded-md border bg-[#fffdf4]/55 p-3" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4" />
      </summary>
      {children}
    </details>
  );
}

function RoleLine({ roleId }: { roleId: string }) {
  const role = roleById.get(roleId);
  if (!role) return null;

  return (
    <details className="rounded-md border bg-[#fffdf4]/65 p-2">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold [&::-webkit-details-marker]:hidden">
        <Image alt="" height={32} src={role.imagePath} width={32} />
        <span>{role.name}</span>
        <ChevronDown className="ml-auto size-4" />
      </summary>
      <p className="mt-2 text-sm leading-5 text-[#6a5848]">{role.ability}</p>
    </details>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      type="button"
      variant={active ? "default" : "outline"}
    >
      {label}
    </Button>
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <Badge
      className={cn(
        "justify-center py-2",
        active
          ? "bg-[#1f432f] text-[#f4f4f2]"
          : "bg-[#fffdf4] text-[#8a1f2b]",
      )}
    >
      {label}
    </Badge>
  );
}
