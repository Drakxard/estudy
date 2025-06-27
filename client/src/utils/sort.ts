export function sortByNumericPrefix(a: string, b: string): number {
  const na = parseInt(a.match(/^(\d+)/)?.[1] ?? '0', 10);
  const nb = parseInt(b.match(/^(\d+)/)?.[1] ?? '0', 10);
  return na - nb;
}
