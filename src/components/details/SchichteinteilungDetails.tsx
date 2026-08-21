import type { Schichteinteilung, Unternehmensverwaltung, Schichtartenverwaltung, Mitarbeiterverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface SchichteinteilungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Schichteinteilung;
  /** N:1-Ziel „Unternehmensverwaltung": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  unternehmensverwaltungList: Unternehmensverwaltung[];
  /** Klick auf die Unternehmensverwaltung-Relation → overlay.push auf dessen Detail. */
  onOpenUnternehmensverwaltung?: (record: Unternehmensverwaltung) => void;
  /** N:1-Ziel „Schichtartenverwaltung": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  schichtartenverwaltungList: Schichtartenverwaltung[];
  /** Klick auf die Schichtartenverwaltung-Relation → overlay.push auf dessen Detail. */
  onOpenSchichtartenverwaltung?: (record: Schichtartenverwaltung) => void;
  /** N:1-Ziel „Mitarbeiterverwaltung": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitarbeiterverwaltungList: Mitarbeiterverwaltung[];
  /** Klick auf die Mitarbeiterverwaltung-Relation → overlay.push auf dessen Detail. */
  onOpenMitarbeiterverwaltung?: (record: Mitarbeiterverwaltung) => void;
}

export function SchichteinteilungDetails({
  record,
  unternehmensverwaltungList,
  onOpenUnternehmensverwaltung,
  schichtartenverwaltungList,
  onOpenSchichtartenverwaltung,
  mitarbeiterverwaltungList,
  onOpenMitarbeiterverwaltung,
}: SchichteinteilungDetailsProps) {
  const zuweisung_unternehmenTarget = unternehmensverwaltungList.find(r => r.record_id === extractRecordId(record.fields.zuweisung_unternehmen));
  const zuweisung_schichtartTarget = schichtartenverwaltungList.find(r => r.record_id === extractRecordId(record.fields.zuweisung_schichtart));
  const zuweisung_mitarbeiterTarget = mitarbeiterverwaltungList.find(r => r.record_id === extractRecordId(record.fields.zuweisung_mitarbeiter));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_notiz')} value={record.fields.zuweisung_notiz} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_ende')} value={record.fields.zuweisung_ende} format="text" />
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_datum')} value={record.fields.zuweisung_datum} format="date" />
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_beginn')} value={record.fields.zuweisung_beginn} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('schichteinteilung', 'zuweisung_unternehmen')}
          name={zuweisung_unternehmenTarget?.fields.unternehmen_name ?? '—'}
          meta={[zuweisung_unternehmenTarget?.fields.unternehmen_plz, zuweisung_unternehmenTarget?.fields.unternehmen_ort].filter(Boolean).join(' · ') || undefined}
          onClick={zuweisung_unternehmenTarget && onOpenUnternehmensverwaltung ? () => onOpenUnternehmensverwaltung!(zuweisung_unternehmenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('schichteinteilung', 'zuweisung_schichtart')}
          name={zuweisung_schichtartTarget?.fields.schichtart_name ?? '—'}
          meta={[zuweisung_schichtartTarget?.fields.schichtart_ende, zuweisung_schichtartTarget?.fields.schichtart_beginn].filter(Boolean).join(' · ') || undefined}
          onClick={zuweisung_schichtartTarget && onOpenSchichtartenverwaltung ? () => onOpenSchichtartenverwaltung!(zuweisung_schichtartTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('schichteinteilung', 'zuweisung_mitarbeiter')}
          name={zuweisung_mitarbeiterTarget?.fields.mitarbeiter_vorname ?? '—'}
          meta={[zuweisung_mitarbeiterTarget?.fields.mitarbeiter_telefon, zuweisung_mitarbeiterTarget?.fields.mitarbeiter_email].filter(Boolean).join(' · ') || undefined}
          onClick={zuweisung_mitarbeiterTarget && onOpenMitarbeiterverwaltung ? () => onOpenMitarbeiterverwaltung!(zuweisung_mitarbeiterTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.SCHICHTEINTEILUNG} recordId={record.record_id} />
    </>
  );
}
