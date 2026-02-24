import type { Schichteinteilung } from './app';

export type EnrichedSchichteinteilung = Schichteinteilung & {
  zuweisung_mitarbeiterName: string;
  zuweisung_unternehmenName: string;
  zuweisung_schichtartName: string;
};
