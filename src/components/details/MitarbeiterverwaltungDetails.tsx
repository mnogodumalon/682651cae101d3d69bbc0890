import type { Mitarbeiterverwaltung, Schichteinteilung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface MitarbeiterverwaltungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Mitarbeiterverwaltung;
  /** 1:N „Schichteinteilung" (zuweisung_mitarbeiter): VOLLE Liste — der Block filtert auf diesen Record. */
  schichteinteilungList: Schichteinteilung[];
  /** Zeilen-Klick → overlay.push auf das Schichteinteilung-Detail (nie der Edit-Dialog). */
  onOpenSchichteinteilung: (record: Schichteinteilung) => void;
  /** Kontextuelles „+": öffnet den Schichteinteilung-Dialog mit diesem Record vorgesetzt. */
  onAddSchichteinteilung: () => void;
}

export function MitarbeiterverwaltungDetails({
  record,
  schichteinteilungList,
  onOpenSchichteinteilung,
  onAddSchichteinteilung,
}: MitarbeiterverwaltungDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitarbeiterverwaltung', 'mitarbeiter_vorname')} value={record.fields.mitarbeiter_vorname} format="text" />
        <RecordField label={fieldLabel('mitarbeiterverwaltung', 'mitarbeiter_telefon')} value={record.fields.mitarbeiter_telefon} format="text" />
        <RecordField label={fieldLabel('mitarbeiterverwaltung', 'mitarbeiter_nachname')} value={record.fields.mitarbeiter_nachname} format="text" />
        <RecordField label={fieldLabel('mitarbeiterverwaltung', 'mitarbeiter_email')} value={record.fields.mitarbeiter_email} format="email" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('schichteinteilung')}
        items={schichteinteilungList.filter(r => extractRecordId(r.fields.zuweisung_mitarbeiter) === record.record_id)}
        map={r => ({ name: r.fields.zuweisung_ende ?? appLabel('schichteinteilung'), meta: r.fields.zuweisung_datum })}
        onOpen={onOpenSchichteinteilung}
        onAdd={onAddSchichteinteilung}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.MITARBEITERVERWALTUNG} recordId={record.record_id} />
    </>
  );
}
