import type { Unternehmensverwaltung, Schichteinteilung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface UnternehmensverwaltungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Unternehmensverwaltung;
  /** 1:N „Schichteinteilung" (zuweisung_unternehmen): VOLLE Liste — der Block filtert auf diesen Record. */
  schichteinteilungList: Schichteinteilung[];
  /** Zeilen-Klick → overlay.push auf das Schichteinteilung-Detail (nie der Edit-Dialog). */
  onOpenSchichteinteilung: (record: Schichteinteilung) => void;
  /** Kontextuelles „+": öffnet den Schichteinteilung-Dialog mit diesem Record vorgesetzt. */
  onAddSchichteinteilung: () => void;
}

export function UnternehmensverwaltungDetails({
  record,
  schichteinteilungList,
  onOpenSchichteinteilung,
  onAddSchichteinteilung,
}: UnternehmensverwaltungDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_name')} value={record.fields.unternehmen_name} format="text" />
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_plz')} value={record.fields.unternehmen_plz} format="text" />
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_notiz')} value={record.fields.unternehmen_notiz} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_ort')} value={record.fields.unternehmen_ort} format="text" />
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_strasse')} value={record.fields.unternehmen_strasse} format="text" />
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_hausnummer')} value={record.fields.unternehmen_hausnummer} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('schichteinteilung')}
        items={schichteinteilungList.filter(r => extractRecordId(r.fields.zuweisung_unternehmen) === record.record_id)}
        map={r => ({ name: r.fields.zuweisung_ende ?? appLabel('schichteinteilung'), meta: r.fields.zuweisung_datum })}
        onOpen={onOpenSchichteinteilung}
        onAdd={onAddSchichteinteilung}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.UNTERNEHMENSVERWALTUNG} recordId={record.record_id} />
    </>
  );
}
