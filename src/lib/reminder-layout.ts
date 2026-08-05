type TriangularReminderLayoutOptions = {
  index: number;
  count: number;
  outwardAngle: number;
  playerSize: number;
  reminderSize: number;
  clearance: number;
  gap: number;
};

export function getTriangularReminderOffset({
  index,
  count,
  outwardAngle,
  playerSize,
  reminderSize,
  clearance,
  gap,
}: TriangularReminderLayoutOptions) {
  const rowCount = Math.max(
    1,
    Math.floor((Math.sqrt(Math.max(1, count) * 8 + 1) - 1) / 2),
  );
  const remindersPerRow = Array.from(
    { length: rowCount },
    (_, row) => rowCount - row,
  );
  let extras = count - (rowCount * (rowCount + 1)) / 2;

  for (let row = 0; extras > 0; row = (row + 1) % rowCount) {
    remindersPerRow[row] = (remindersPerRow[row] ?? 0) + 1;
    extras -= 1;
  }

  let row = 0;
  let rowStart = 0;
  while (
    index >= rowStart + (remindersPerRow[row] ?? 1) &&
    row < rowCount - 1
  ) {
    rowStart += remindersPerRow[row] ?? 1;
    row += 1;
  }

  const indexInRow = index - rowStart;
  const remindersInRow = remindersPerRow[row] ?? 1;
  const tangentOffset =
    (indexInRow - (remindersInRow - 1) / 2) * (reminderSize + gap);
  const inwardDistance =
    playerSize / 2 + clearance + reminderSize / 2 + row * (reminderSize + gap);
  const inwardAngle = ((outwardAngle + 180) * Math.PI) / 180;
  const tangentAngle = inwardAngle + Math.PI / 2;

  return {
    x:
      Math.cos(inwardAngle) * inwardDistance +
      Math.cos(tangentAngle) * tangentOffset,
    y:
      Math.sin(inwardAngle) * inwardDistance +
      Math.sin(tangentAngle) * tangentOffset,
  };
}
