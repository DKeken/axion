export const formatProtoEnum = (
  enumObject: Record<string, string | number>,
  value: number | undefined
): string => {
  if (value === undefined) return "UNKNOWN";
  // ts-proto generates numeric enums with reverse-mapping in JS output.
  const label = enumObject[value];
  if (typeof label === "string") return label;
  return String(value);
};
