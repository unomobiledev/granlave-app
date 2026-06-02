/**
 * Aplica máscara de placa (Mercosul ABC1D23 ou antiga ABC1234).
 * Aceita entrada com ou sem hífen e devolve no formato `XXX-YYYY`.
 */
export function formatPlaca(value: string): string {
  const clean = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

export function isPlacaValida(value: string): boolean {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(clean);
}