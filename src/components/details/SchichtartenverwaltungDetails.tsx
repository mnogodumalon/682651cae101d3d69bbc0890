import type { Schichtartenverwaltung, Schichteinteilung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface SchichtartenverwaltungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Schichtartenverwaltung;
  /** 1:N „Schichteinteilung" (zuweisung_schichtart): VOLLE Liste — der Block filtert auf diesen Record. */
  schichteinteilungList: Schichteinteilung[];
  /** Zeilen-Klick → overlay.push auf das Schichteinteilung-Detail (nie der Edit-Dialog). */
  onOpenSchichteinteilung: (record: Schichteinteilung) => void;
  /** Kontextuelles „+": öffnet den Schichteinteilung-Dialog mit diesem Record vorgesetzt. */
  onAddSchichteinteilung: () => void;
}

export function SchichtartenverwaltungDetails({
  record,
  schichteinteilungList,
  onOpenSchichteinteilung,
  onAddSchichteinteilung,
}: SchichtartenverwaltungDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('schichtartenverwaltung', 'schichtart_name')} value={record.fields.schichtart_name} format="text" />
        <RecordField label={fieldLabel('schichtartenverwaltung', 'schichtart_beschreibung')} value={record.fields.schichtart_beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('schichtartenverwaltung', 'schichtart_ende')} value={record.fields.schichtart_ende} format="text" />
        <RecordField label={fieldLabel('schichtartenverwaltung', 'schichtart_beginn')} value={record.fields.schichtart_beginn} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('schichteinteilung')}
        items={schichteinteilungList.filter(r => extractRecordId(r.fields.zuweisung_schichtart) === record.record_id)}
        map={r => ({ name: r.fields.zuweisung_ende ?? appLabel('schichteinteilung'), meta: r.fields.zuweisung_datum })}
        onOpen={onOpenSchichteinteilung}
        onAdd={onAddSchichteinteilung}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.SCHICHTARTENVERWALTUNG} recordId={record.record_id} />
    </>
  );
}
