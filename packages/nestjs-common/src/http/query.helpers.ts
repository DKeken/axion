export const toNumberOrUndefined = (value?: string): number | undefined => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

export const toNonNegativeIntOrUndefined = (
  value?: string
): number | undefined => {
  const parsed = toNumberOrUndefined(value);
  if (parsed === undefined) return undefined;
  if (parsed < 0) return undefined;
  return Math.floor(parsed);
};
