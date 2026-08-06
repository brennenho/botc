"use client";

import { useEffect, useState } from "react";
import { Plus, Shuffle, Trash2, X } from "lucide-react";

import { RoleArtwork } from "@/components/grimoire/role-artwork";
import { RoleDistributionDialog } from "@/components/grimoire/role-distribution-dialog";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
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
  onClearRole,
  onRemovePlayer,
  onRename,
  onAddPlayer,
  onDistributeRoles,
  onClearAssignments,
}: {
  editionId: EditionId;
  seats: Seat[];
  onClose: () => void;
  onSelectSeat: (seatId: string) => void;
  onChooseRole: (seatId: string) => void;
  onClearRole: (seatId: string) => void;
  onRemovePlayer: (seatId: string) => void;
  onRename: (seatId: string, name: string) => void;
  onAddPlayer: () => void;
  onDistributeRoles: (roleIds: string[]) => void;
  onClearAssignments: () => void;
}) {
  const [distributionOpen, setDistributionOpen] = useState(false);
  const [armedRemoveSeatId, setArmedRemoveSeatId] = useState<string | null>(
    null,
  );
  const assessment = getSetupAssessment(seats);

  useEffect(() => {
    if (!armedRemoveSeatId) return;
    const timeout = window.setTimeout(() => setArmedRemoveSeatId(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [armedRemoveSeatId]);

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
    assessment.assignedCount === seats.length && !assessment.legal
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
          const removeArmed = armedRemoveSeatId === seat.id;
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
              <div className="roster-role-control">
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
              <IconButton
                label={
                  removeArmed
                    ? `Click again to remove ${seat.playerName}`
                    : `Remove ${seat.playerName}`
                }
                size="sm"
                variant="danger"
                tooltipSide="left"
                className={cn(
                  "roster-remove-player",
                  removeArmed && "is-confirming",
                )}
                aria-pressed={removeArmed}
                onClick={() => {
                  if (removeArmed) {
                    onRemovePlayer(seat.id);
                    setArmedRemoveSeatId(null);
                    return;
                  }
                  setArmedRemoveSeatId(seat.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </IconButton>
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
          Distribute roles
        </Button>
        <Button size="sm" variant="secondary" onClick={onAddPlayer}>
          <Plus className="size-4" />
          Add player
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="roster-clear-assignments"
          disabled={assessment.assignedCount === 0}
          onClick={onClearAssignments}
        >
          <X className="size-4" />
          Clear all
        </Button>
      </footer>
      <RoleDistributionDialog
        open={distributionOpen}
        editionId={editionId}
        playerCount={seats.filter((seat) => !seat.isTraveller).length}
        onOpenChange={setDistributionOpen}
        onDistribute={onDistributeRoles}
      />
    </>
  );
}
