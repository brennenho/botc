"use client";

import { useState } from "react";
import { Check, Dice5, Plus } from "lucide-react";

import { RandomDistributionDialog } from "@/components/grimoire/random-distribution-dialog";
import { RoleArtwork } from "@/components/grimoire/role-artwork";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSetupAssessment, roleById } from "@/lib/game-data";
import type { EditionId, Seat } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

export function RosterPanel({
  editionId,
  seats,
  onClose,
  onSelectSeat,
  onChooseRole,
  onRename,
  onAddPlayer,
  onRandomize,
}: {
  editionId: EditionId;
  seats: Seat[];
  onClose: () => void;
  onSelectSeat: (seatId: string) => void;
  onChooseRole: (seatId: string) => void;
  onRename: (seatId: string, name: string) => void;
  onAddPlayer: () => void;
  onRandomize: (roleIds: string[]) => void;
}) {
  const [randomOpen, setRandomOpen] = useState(false);
  const assessment = getSetupAssessment(seats);
  const targetSummary = assessment.expected
    ? (["townsfolk", "outsider", "minion", "demon"] as const)
        .filter((team) => assessment.expected?.[team])
        .map((team) => {
          const count = assessment.expected?.[team] ?? 0;
          const label =
            team === "townsfolk"
              ? "Townsfolk"
              : `${team[0]?.toUpperCase()}${team.slice(1)}${count === 1 ? "" : "s"}`;
          return `${count} ${label}`;
        })
        .join(" · ")
    : null;
  const setupIssue =
    assessment.assignedCount === seats.length && !assessment.legal
      ? assessment.warnings[0]
      : null;

  return (
    <>
      <div className="roster-summary">
        <div className="roster-progress">
          <span>Characters</span>
          <strong className={cn(assessment.legal && "is-legal")}>
            {assessment.legal && <Check className="size-3.5" />}
            {assessment.legal
              ? "Legal setup"
              : `${assessment.assignedCount} of ${seats.length} assigned`}
          </strong>
        </div>
        {targetSummary && (
          <p>
            <span>Target</span>
            {targetSummary}
          </p>
        )}
      </div>

      {setupIssue && <p className="roster-setup-issue">{setupIssue}</p>}

      <div className="roster-list">
        {seats.map((seat, index) => {
          const role = seat.roleId ? roleById.get(seat.roleId) : null;
          return (
            <div key={seat.id} className="roster-row">
              <button
                type="button"
                className="roster-seat-number"
                onClick={() => {
                  onSelectSeat(seat.id);
                  onClose();
                }}
              >
                {index + 1}
              </button>
              <Input
                key={`${seat.id}-${seat.playerName}`}
                defaultValue={seat.playerName}
                maxLength={40}
                aria-label={`Name for seat ${index + 1}`}
                className="h-9 min-w-0 border-0 bg-transparent px-1 focus:bg-white/55 focus:ring-0"
                onBlur={(event) => {
                  const name = event.target.value.trim();
                  if (name && name !== seat.playerName) onRename(seat.id, name);
                }}
              />
              <button
                type="button"
                className={cn("roster-role", !role && "is-empty")}
                onClick={() => onChooseRole(seat.id)}
                title={
                  role
                    ? `Change ${seat.playerName}'s character`
                    : `Assign ${seat.playerName}`
                }
              >
                {role ? (
                  <RoleArtwork role={role} size="tiny" />
                ) : (
                  <Plus className="size-4" />
                )}
                <span>{role?.name ?? "Assign"}</span>
              </button>
            </div>
          );
        })}
      </div>

      <footer className="sheet-footer">
        <Button variant="secondary" onClick={() => setRandomOpen(true)}>
          <Dice5 className="size-4" />
          Random distribute
        </Button>
        <Button variant="quiet" onClick={onAddPlayer}>
          <Plus className="size-4" />
          Add player
        </Button>
      </footer>
      <RandomDistributionDialog
        open={randomOpen}
        editionId={editionId}
        playerCount={seats.filter((seat) => !seat.isTraveller).length}
        onOpenChange={setRandomOpen}
        onDistribute={onRandomize}
      />
    </>
  );
}
