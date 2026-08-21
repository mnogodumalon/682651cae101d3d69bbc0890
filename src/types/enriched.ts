import type { Schichteinteilung } from './app';

export type EnrichedSchichteinteilung = Schichteinteilung & {
  zuweisung_unternehmenName: string;
  zuweisung_schichtartName: string;
  zuweisung_mitarbeiterName: string;
};
