// Asigna un color consistente a cada zona para los badges.
// Paleta con buen contraste tanto en claro como en oscuro.
const PALETA = [
  { bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-violet-100 dark:bg-violet-500/15', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  { bg: 'bg-rose-100 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/15', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
  { bg: 'bg-fuchsia-100 dark:bg-fuchsia-500/15', text: 'text-fuchsia-700 dark:text-fuchsia-300', dot: 'bg-fuchsia-500' },
  { bg: 'bg-lime-100 dark:bg-lime-500/15', text: 'text-lime-700 dark:text-lime-300', dot: 'bg-lime-500' },
  { bg: 'bg-orange-100 dark:bg-orange-500/15', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  { bg: 'bg-teal-100 dark:bg-teal-500/15', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  { bg: 'bg-indigo-100 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  { bg: 'bg-pink-100 dark:bg-pink-500/15', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
];

// Hash estable de string a índice de paleta
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function colorZona(zona: string) {
  return PALETA[hash(zona) % PALETA.length];
}
