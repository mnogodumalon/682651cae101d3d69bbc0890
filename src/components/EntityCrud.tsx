/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'unternehmensverwaltung'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.unternehmensverwaltung.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.unternehmensverwaltung.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.unternehmensverwaltung.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.unternehmensverwaltung              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   unternehmensverwaltung: unternehmen_name, unternehmen_plz, unternehmen_notiz, unternehmen_ort, unternehmen_strasse, unternehmen_hausnummer  ·  ← schichteinteilung (list + contextual +)
 *   schichteinteilung: zuweisung_notiz, zuweisung_ende, zuweisung_datum, zuweisung_unternehmen, zuweisung_schichtart, zuweisung_beginn, zuweisung_mitarbeiter  ·  → unternehmensverwaltung · → schichtartenverwaltung · → mitarbeiterverwaltung
 *   schichtartenverwaltung: schichtart_name, schichtart_beschreibung, schichtart_ende, schichtart_beginn  ·  ← schichteinteilung (list + contextual +)
 *   mitarbeiterverwaltung: mitarbeiter_vorname, mitarbeiter_telefon, mitarbeiter_nachname, mitarbeiter_email  ·  ← schichteinteilung (list + contextual +)
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Unternehmensverwaltung, Schichteinteilung, Schichtartenverwaltung, Mitarbeiterverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichSchichteinteilung } from '@/lib/enrich';
import type { EnrichedSchichteinteilung } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { UnternehmensverwaltungDialog, type UnternehmensverwaltungDialogDefaults } from '@/components/dialogs/UnternehmensverwaltungDialog';
import { UnternehmensverwaltungDetails } from '@/components/details/UnternehmensverwaltungDetails';
import { SchichteinteilungDialog, type SchichteinteilungDialogDefaults } from '@/components/dialogs/SchichteinteilungDialog';
import { SchichteinteilungDetails } from '@/components/details/SchichteinteilungDetails';
import { SchichtartenverwaltungDialog, type SchichtartenverwaltungDialogDefaults } from '@/components/dialogs/SchichtartenverwaltungDialog';
import { SchichtartenverwaltungDetails } from '@/components/details/SchichtartenverwaltungDetails';
import { MitarbeiterverwaltungDialog, type MitarbeiterverwaltungDialogDefaults } from '@/components/dialogs/MitarbeiterverwaltungDialog';
import { MitarbeiterverwaltungDetails } from '@/components/details/MitarbeiterverwaltungDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'unternehmensverwaltung'; record: Unternehmensverwaltung }
  | { type: 'schichteinteilung'; record: EnrichedSchichteinteilung }
  | { type: 'schichtartenverwaltung'; record: Schichtartenverwaltung }
  | { type: 'mitarbeiterverwaltung'; record: Mitarbeiterverwaltung };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  unternehmensverwaltung: EntityCrudApi<Unternehmensverwaltung, UnternehmensverwaltungDialogDefaults>;
  schichteinteilung: EntityCrudApi<Schichteinteilung, SchichteinteilungDialogDefaults>;
  schichtartenverwaltung: EntityCrudApi<Schichtartenverwaltung, SchichtartenverwaltungDialogDefaults>;
  mitarbeiterverwaltung: EntityCrudApi<Mitarbeiterverwaltung, MitarbeiterverwaltungDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { unternehmensverwaltung: Unternehmensverwaltung[]; schichteinteilung: EnrichedSchichteinteilung[]; schichtartenverwaltung: Schichtartenverwaltung[]; mitarbeiterverwaltung: Mitarbeiterverwaltung[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  const [unternehmensverwaltungDialog, setUnternehmensverwaltungDialog] = useState<{ defaults?: UnternehmensverwaltungDialogDefaults; editing?: Unternehmensverwaltung } | null>(null);
  const [schichteinteilungDialog, setSchichteinteilungDialog] = useState<{ defaults?: SchichteinteilungDialogDefaults; editing?: Schichteinteilung } | null>(null);
  const [schichtartenverwaltungDialog, setSchichtartenverwaltungDialog] = useState<{ defaults?: SchichtartenverwaltungDialogDefaults; editing?: Schichtartenverwaltung } | null>(null);
  const [mitarbeiterverwaltungDialog, setMitarbeiterverwaltungDialog] = useState<{ defaults?: MitarbeiterverwaltungDialogDefaults; editing?: Mitarbeiterverwaltung } | null>(null);
  const enrichedSchichteinteilung = useMemo(() => enrichSchichteinteilung(data.schichteinteilung, { unternehmensverwaltungMap: data.unternehmensverwaltungMap, schichtartenverwaltungMap: data.schichtartenverwaltungMap, mitarbeiterverwaltungMap: data.mitarbeiterverwaltungMap }), [data.schichteinteilung, data.unternehmensverwaltungMap, data.schichtartenverwaltungMap, data.mitarbeiterverwaltungMap]);

  function detailUnternehmensverwaltung(record: Unternehmensverwaltung, push = false) {
    const item: OverlayItem = { type: 'unternehmensverwaltung', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitUnternehmensverwaltung(fields: Unternehmensverwaltung['fields']) {
    const editing = unternehmensverwaltungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setUnternehmensverwaltung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateUnternehmensverwaltungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('unternehmensverwaltung')} — ${t('crud_updated')}`, async () => {
        data.setUnternehmensverwaltung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateUnternehmensverwaltungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createUnternehmensverwaltungEntry(fields);
      undoToast(`${appLabel('unternehmensverwaltung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailSchichteinteilung(record: Schichteinteilung, push = false) {
    const rec = enrichedSchichteinteilung.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'schichteinteilung', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitSchichteinteilung(fields: Schichteinteilung['fields']) {
    const editing = schichteinteilungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setSchichteinteilung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateSchichteinteilungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('schichteinteilung')} — ${t('crud_updated')}`, async () => {
        data.setSchichteinteilung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateSchichteinteilungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createSchichteinteilungEntry(fields);
      undoToast(`${appLabel('schichteinteilung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailSchichtartenverwaltung(record: Schichtartenverwaltung, push = false) {
    const item: OverlayItem = { type: 'schichtartenverwaltung', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitSchichtartenverwaltung(fields: Schichtartenverwaltung['fields']) {
    const editing = schichtartenverwaltungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setSchichtartenverwaltung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateSchichtartenverwaltungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('schichtartenverwaltung')} — ${t('crud_updated')}`, async () => {
        data.setSchichtartenverwaltung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateSchichtartenverwaltungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createSchichtartenverwaltungEntry(fields);
      undoToast(`${appLabel('schichtartenverwaltung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailMitarbeiterverwaltung(record: Mitarbeiterverwaltung, push = false) {
    const item: OverlayItem = { type: 'mitarbeiterverwaltung', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitarbeiterverwaltung(fields: Mitarbeiterverwaltung['fields']) {
    const editing = mitarbeiterverwaltungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitarbeiterverwaltung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitarbeiterverwaltungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitarbeiterverwaltung')} — ${t('crud_updated')}`, async () => {
        data.setMitarbeiterverwaltung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitarbeiterverwaltungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitarbeiterverwaltungEntry(fields);
      undoToast(`${appLabel('mitarbeiterverwaltung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <UnternehmensverwaltungDialog
        open={unternehmensverwaltungDialog !== null}
        onClose={() => setUnternehmensverwaltungDialog(null)}
        onSubmit={submitUnternehmensverwaltung}
        defaultValues={unternehmensverwaltungDialog?.defaults}
        recordId={unternehmensverwaltungDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Unternehmensverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Unternehmensverwaltung']}
      />
      <SchichteinteilungDialog
        open={schichteinteilungDialog !== null}
        onClose={() => setSchichteinteilungDialog(null)}
        onSubmit={submitSchichteinteilung}
        defaultValues={schichteinteilungDialog?.defaults}
        recordId={schichteinteilungDialog?.editing?.record_id}
        unternehmensverwaltungList={data.unternehmensverwaltung}
        schichtartenverwaltungList={data.schichtartenverwaltung}
        mitarbeiterverwaltungList={data.mitarbeiterverwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['Schichteinteilung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schichteinteilung']}
      />
      <SchichtartenverwaltungDialog
        open={schichtartenverwaltungDialog !== null}
        onClose={() => setSchichtartenverwaltungDialog(null)}
        onSubmit={submitSchichtartenverwaltung}
        defaultValues={schichtartenverwaltungDialog?.defaults}
        recordId={schichtartenverwaltungDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Schichtartenverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schichtartenverwaltung']}
      />
      <MitarbeiterverwaltungDialog
        open={mitarbeiterverwaltungDialog !== null}
        onClose={() => setMitarbeiterverwaltungDialog(null)}
        onSubmit={submitMitarbeiterverwaltung}
        defaultValues={mitarbeiterverwaltungDialog?.defaults}
        recordId={mitarbeiterverwaltungDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Mitarbeiterverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitarbeiterverwaltung']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'unternehmensverwaltung') {
            return (
              <>
                <RecordHeader title={top.record.fields.unternehmen_name ?? appLabel('unternehmensverwaltung')} subtitle={undefined} />
                <UnternehmensverwaltungDetails
                  record={top.record}
                  schichteinteilungList={data.schichteinteilung}
                  onOpenSchichteinteilung={(r) => detailSchichteinteilung(r, true)}
                  onAddSchichteinteilung={() => setSchichteinteilungDialog({ defaults: { zuweisung_unternehmen: createRecordUrl(APP_IDS.UNTERNEHMENSVERWALTUNG, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'schichteinteilung') {
            return (
              <>
                <RecordHeader title={top.record.fields.zuweisung_ende ?? appLabel('schichteinteilung')} subtitle={top.record.fields.zuweisung_datum ? formatDate(top.record.fields.zuweisung_datum) : undefined} />
                <SchichteinteilungDetails
                  record={top.record}
                  unternehmensverwaltungList={data.unternehmensverwaltung}
                  onOpenUnternehmensverwaltung={(r) => detailUnternehmensverwaltung(r, true)}
                  schichtartenverwaltungList={data.schichtartenverwaltung}
                  onOpenSchichtartenverwaltung={(r) => detailSchichtartenverwaltung(r, true)}
                  mitarbeiterverwaltungList={data.mitarbeiterverwaltung}
                  onOpenMitarbeiterverwaltung={(r) => detailMitarbeiterverwaltung(r, true)}
                />
              </>
            );
          }
          if (top.type === 'schichtartenverwaltung') {
            return (
              <>
                <RecordHeader title={top.record.fields.schichtart_name ?? appLabel('schichtartenverwaltung')} subtitle={undefined} />
                <SchichtartenverwaltungDetails
                  record={top.record}
                  schichteinteilungList={data.schichteinteilung}
                  onOpenSchichteinteilung={(r) => detailSchichteinteilung(r, true)}
                  onAddSchichteinteilung={() => setSchichteinteilungDialog({ defaults: { zuweisung_schichtart: createRecordUrl(APP_IDS.SCHICHTARTENVERWALTUNG, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'mitarbeiterverwaltung') {
            return (
              <>
                <RecordHeader title={top.record.fields.mitarbeiter_vorname ?? appLabel('mitarbeiterverwaltung')} subtitle={undefined} />
                <MitarbeiterverwaltungDetails
                  record={top.record}
                  schichteinteilungList={data.schichteinteilung}
                  onOpenSchichteinteilung={(r) => detailSchichteinteilung(r, true)}
                  onAddSchichteinteilung={() => setSchichteinteilungDialog({ defaults: { zuweisung_mitarbeiter: createRecordUrl(APP_IDS.MITARBEITERVERWALTUNG, top.record.record_id) } })}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'unternehmensverwaltung') setUnternehmensverwaltungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'schichteinteilung') setSchichteinteilungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'schichtartenverwaltung') setSchichtartenverwaltungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'mitarbeiterverwaltung') setMitarbeiterverwaltungDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    unternehmensverwaltung: {
      openCreate: (defaults?: UnternehmensverwaltungDialogDefaults) => setUnternehmensverwaltungDialog({ defaults }),
      openEdit: (record: Unternehmensverwaltung) => setUnternehmensverwaltungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Unternehmensverwaltung) => detailUnternehmensverwaltung(record, false),
    },
    schichteinteilung: {
      openCreate: (defaults?: SchichteinteilungDialogDefaults) => setSchichteinteilungDialog({ defaults }),
      openEdit: (record: Schichteinteilung) => setSchichteinteilungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Schichteinteilung) => detailSchichteinteilung(record, false),
    },
    schichtartenverwaltung: {
      openCreate: (defaults?: SchichtartenverwaltungDialogDefaults) => setSchichtartenverwaltungDialog({ defaults }),
      openEdit: (record: Schichtartenverwaltung) => setSchichtartenverwaltungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Schichtartenverwaltung) => detailSchichtartenverwaltung(record, false),
    },
    mitarbeiterverwaltung: {
      openCreate: (defaults?: MitarbeiterverwaltungDialogDefaults) => setMitarbeiterverwaltungDialog({ defaults }),
      openEdit: (record: Mitarbeiterverwaltung) => setMitarbeiterverwaltungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Mitarbeiterverwaltung) => detailMitarbeiterverwaltung(record, false),
    },
    enriched: { unternehmensverwaltung: data.unternehmensverwaltung, schichteinteilung: enrichedSchichteinteilung, schichtartenverwaltung: data.schichtartenverwaltung, mitarbeiterverwaltung: data.mitarbeiterverwaltung },
  };
}
