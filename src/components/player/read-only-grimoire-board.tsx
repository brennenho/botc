"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { PublicPlayerToken } from "@/components/grimoire/public-player-token";
import { IconButton } from "@/components/ui/icon-button";
import type { PlayerSeatView, Seat } from "@/lib/game-data/types";
import { getGrimoirePlayerTokenSize } from "@/lib/grimoire-canvas";
import { getPlayerLabelSide } from "@/lib/reminder-layout";

const PLAYER_BOARD_WIDTH = 1024;
const PLAYER_BOARD_HEIGHT = 640;

export function ReadOnlyGrimoireBoard({
  seats,
  ownSeat,
  onlineSeatIds,
  redacted,
}: {
  seats: PlayerSeatView[];
  ownSeat: Seat;
  onlineSeatIds: ReadonlySet<string>;
  redacted: boolean;
}) {
  const orderedSeats = [...seats].sort((a, b) => a.seatIndex - b.seatIndex);
  const tokenSize = getGrimoirePlayerTokenSize(orderedSeats.length);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fitScale = useBoardFitScale(viewportRef);
  const initialScale = fitScale
    ? Math.max(fitScale, Math.min(0.5, fitScale * 1.35))
    : null;

  return (
    <div ref={viewportRef} className="grimoire-frame player-grimoire-frame">
      {fitScale && initialScale ? (
        <TransformWrapper
          initialScale={initialScale}
          minScale={fitScale * 0.85}
          maxScale={Math.max(2, fitScale * 4)}
          centerOnInit
          centerZoomedOut
          limitToBounds
          wheel={{ step: 0.08, excluded: ["player-board-controls"] }}
          pinch={{ step: 4, excluded: ["player-board-controls"] }}
          panning={{
            velocityDisabled: true,
            excluded: ["player-board-controls"],
          }}
          doubleClick={{
            mode: "toggle",
            step: 0.45,
            excluded: ["player-board-controls"],
          }}
        >
          {({ centerView, zoomIn, zoomOut }) => (
            <>
              <TransformComponent
                wrapperClass="player-board-camera"
                contentClass="player-board-camera-content"
                wrapperProps={{ "aria-label": "Town Seating" }}
              >
                <div
                  className="grimoire-board player-grimoire-canvas"
                  style={{
                    width: PLAYER_BOARD_WIDTH,
                    height: PLAYER_BOARD_HEIGHT,
                  }}
                >
                  {orderedSeats.map((seatView) => {
                    const labelSide = getPlayerLabelSide({
                      playerPosition: seatView.position,
                    });

                    return (
                      <div
                        key={seatView.id}
                        className="canvas-player-position"
                        style={{
                          left: `${seatView.position.x}%`,
                          top: `${seatView.position.y}%`,
                        }}
                      >
                        <PublicPlayerToken
                          seat={seatView}
                          ownSeat={ownSeat}
                          tokenSize={tokenSize}
                          labelSide={labelSide}
                          redacted={redacted}
                          presenceStatus={
                            seatView.occupied
                              ? onlineSeatIds.has(seatView.id)
                                ? "online"
                                : "offline"
                              : undefined
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </TransformComponent>

              <div
                className="player-board-controls"
                role="group"
                aria-label="Board View Controls"
              >
                <IconButton
                  label="Zoom Out"
                  size="sm"
                  variant="quiet"
                  onClick={() => zoomOut(0.2)}
                >
                  <Minus aria-hidden="true" />
                </IconButton>
                <IconButton
                  label="Fit Board"
                  size="sm"
                  variant="quiet"
                  onClick={() => centerView(fitScale, 180, "easeOut")}
                >
                  <Maximize2 aria-hidden="true" />
                </IconButton>
                <IconButton
                  label="Zoom In"
                  size="sm"
                  variant="quiet"
                  onClick={() => zoomIn(0.2)}
                >
                  <Plus aria-hidden="true" />
                </IconButton>
              </div>
            </>
          )}
        </TransformWrapper>
      ) : null}
    </div>
  );
}

function useBoardFitScale(viewportRef: RefObject<HTMLDivElement | null>) {
  const [fitScale, setFitScale] = useState<number | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateFitScale = () => {
      const nextScale = Math.min(
        viewport.clientWidth / PLAYER_BOARD_WIDTH,
        viewport.clientHeight / PLAYER_BOARD_HEIGHT,
      );

      if (nextScale > 0) setFitScale(Number(nextScale.toFixed(3)));
    };

    updateFitScale();
    const observer = new ResizeObserver(updateFitScale);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [viewportRef]);

  return fitScale;
}
