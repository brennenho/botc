"use client";

import { useState } from "react";
import { Orbit, Plus, Shuffle, X } from "lucide-react";

import { RemovePlayerButton } from "@/components/storyteller/remove-player-button";
import { RoleDistributionDialog } from "@/components/storyteller/role-distribution-dialog";
import { TokenIcon } from "@/components/storyteller/token-icon";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { getSetupAssessment, roleById } from "@/lib/game-data";
import type { EditionId, GameToken, Seat } from "@/lib/game-data/types";
import { cn } from "@/lib/utils";

export function RosterPanel({
  editionId,
  seats,
  gameTokens,
  onClose,
  onSelectSeat,
  onChooseRole,
  onClearRole,
  onRemovePlayer,
  onRename,
  onAddPlayer,
  onDistributeRoles,
  onClearAssignments,
  onArrangeCircle,
}: {
  editionId: EditionId;
  seats: Seat[];
  gameTokens: GameToken[];
  onClose: () => void;
  onSelectSeat: (seatId: string) => void;
  onChooseRole: (seatId: string) => void;
  onClearRole: (seatId: string) => void;
  onRemovePlayer: (seatId: string) => void;
  onRename: (seatId: string, name: string) => void;
  onAddPlayer: () => void;
  onDistributeRoles: (roleIds: string[]) => void;
  onClearAssignments: () => void;
  onArrangeCircle: () => void;
}) {
  const [distributionOpen, setDistributionOpen] = useState(false);
  const assessment = getSetupAssessment(seats, gameTokens);
  const residentCount = seats.filter((seat) => !seat.isTraveller).length;
  const travellerCount = seats.length - residentCount;

  const defaultSetup = assessment.expected
    ? (["townsfolk", "outsider", "minion", "demon"] as const)
        .filter((team) => assessment.expected?.[team])
        .map((team) => {
          const count = assessment.expected?.[team] ?? 0;
          const label =
            team === "townsfolk"
              ? "Townsfolk"
              : `${team[0]?.toUpperCase()}${team.slice(1)}${count === 1 ? "" : "s"}`;
          return {
            team,
            assigned: assessment.actual[team],
            expected: count,
            label,
          };
        })
    : null;
  const setupIssue =
    assessment.assignedCount === residentCount && !assessment.legal
      ? assessment.warnings[0]
      : null;

  return (
    <>
      <div className="roster-summary">
        {defaultSetup && (
          <div className="roster-team-counts">
            {defaultSetup.map(({ team, assigned, expected, label }) => (
              <span
                key={team}
                className={cn("roster-team-count", `team-${team}`)}
              >
                <strong>
                  <span>{assigned}</span>
                  <span>/ {expected}</span>
                </strong>
                {label}
              </span>
            ))}
          </div>
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
                className={cn(
                  "roster-seat-number",
                  seat.claimedByPlayer && "is-online-player",
                )}
                aria-label={`Seat ${index + 1}, ${
                  seat.claimedByPlayer ? "Online Player" : "Local Seat"
                }`}
                title={seat.claimedByPlayer ? "Online Player" : "Local Seat"}
                onClick={() => {
                  onSelectSeat(seat.id);
                  onClose();
                }}
              >
                {index + 1}
              </button>
              <Input
                key={`${seat.id}-${seat.playerName}`}
                variant="inline"
                defaultValue={seat.playerName}
                maxLength={40}
                aria-label={`Name for seat ${index + 1}`}
                className="h-9 min-w-0"
                onBlur={(event) => {
                  const name = event.target.value.trim();
                  if (name && name !== seat.playerName) onRename(seat.id, name);
                }}
              />
              <div className="roster-role-control">
                <button
                  type="button"
                  className={cn("roster-role", !role && "is-empty")}
                  onClick={() => onChooseRole(seat.id)}
                  title={
                    role
                      ? `Change ${seat.playerName}'s Character`
                      : `Assign ${seat.playerName}`
                  }
                >
                  {role ? (
                    <TokenIcon role={role} />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  <span>{role?.name ?? "Assign"}</span>
                </button>
                {role && (
                  <IconButton
                    label={`Clear ${seat.playerName}'s assignment`}
                    size="sm"
                    variant="quiet"
                    tooltipSide="left"
                    className="roster-role-clear"
                    onClick={() => onClearRole(seat.id)}
                  >
                    <X className="size-3" />
                  </IconButton>
                )}
              </div>
              <RemovePlayerButton
                playerName={seat.playerName}
                display="icon"
                className="roster-remove-player"
                onRemove={() => onRemovePlayer(seat.id)}
              />
            </div>
          );
        })}
      </div>

      <footer className="sheet-footer roster-sheet-footer">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setDistributionOpen(true)}
        >
          <Shuffle className="size-4" />
          Distribute Roles
        </Button>
        <Button size="sm" variant="secondary" onClick={onAddPlayer}>
          <Plus className="size-4" />
          Add Player
        </Button>
        <Button size="sm" variant="secondary" onClick={onArrangeCircle}>
          <Orbit className="size-4" />
          Reset Token Positions
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="roster-clear-assignments"
          disabled={assessment.assignedCount === 0}
          onClick={onClearAssignments}
        >
          <X className="size-4" />
          Clear All
        </Button>
      </footer>
      <RoleDistributionDialog
        open={distributionOpen}
        editionId={editionId}
        residentCount={residentCount}
        travellerCount={travellerCount}
        onOpenChange={setDistributionOpen}
        onDistribute={onDistributeRoles}
      />
    </>
  );
}
