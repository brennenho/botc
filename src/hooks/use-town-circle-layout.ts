"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";

import {
  getTownCircleLayout,
  shouldUseCompactTownLayout,
  type TownCircleBoardSize,
  type TownCircleInsets,
} from "@/lib/town-circle-layout";

const INITIAL_BOARD_SIZE: TownCircleBoardSize = { width: 1000, height: 700 };

export function useTownCircleLayout(
  boardRef: RefObject<HTMLElement | null>,
  seatCount: number,
  insets: TownCircleInsets,
) {
  const [boardSize, setBoardSize] =
    useState<TownCircleBoardSize>(INITIAL_BOARD_SIZE);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const updateBoardSize = () => {
      const { width, height } = board.getBoundingClientRect();
      setBoardSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };

    updateBoardSize();
    const observer = new ResizeObserver(updateBoardSize);
    observer.observe(board);
    return () => observer.disconnect();
  }, [boardRef]);

  const compact = shouldUseCompactTownLayout(boardSize);
  const layout = useMemo(
    () => getTownCircleLayout({ boardSize, seatCount, insets }),
    [boardSize, insets, seatCount],
  );

  return { boardSize, compact, layout };
}
