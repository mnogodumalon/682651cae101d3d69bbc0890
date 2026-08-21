import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Schichteinteilung, Unternehmensverwaltung, Schichtartenverwaltung, Mitarbeiterverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import {
  RecordView, RecordHeader, RecordKeyFacts, RecordSection, RecordField,
  RecordAttachments, RecordViewSkeleton, RecordViewEmpty,
} from '@/components/widgets/RecordView';
import { SchichteinteilungDialog } from '@/components/dialogs/SchichteinteilungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { formEnhancements } from '@/config/form-enhancements/Schichteinteilung';
import { evalComputed } from '@/config/form-enhancements/types';
import { t, appLabel, fieldLabel, localeTag, CURRENCY } from '@/i18n';

export default function SchichteinteilungDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Schichteinteilung | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unternehmensverwaltungList, setUnternehmensverwaltungList] = useState<Unternehmensverwaltung[]>([]);
  const [schichtartenverwaltungList, setSchichtartenverwaltungList] = useState<Schichtartenverwaltung[]>([]);
  const [mitarbeiterverwaltungList, setMitarbeiterverwaltungList] = useState<Mitarbeiterverwaltung[]>([]);

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, unternehmensverwaltungData, schichtartenverwaltungData, mitarbeiterverwaltungData] = await Promise.all([
        LivingAppsService.getSchichteinteilung(),
        LivingAppsService.getUnternehmensverwaltung(),
        LivingAppsService.getSchichtartenverwaltung(),
        LivingAppsService.getMitarbeiterverwaltung(),
      ]);
      setUnternehmensverwaltungList(unternehmensverwaltungData);
      setSchichtartenverwaltungList(schichtartenverwaltungData);
      setMitarbeiterverwaltungList(mitarbeiterverwaltungData);
      setRecord(mainData.find(r => r.record_id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(fields: Schichteinteilung['fields']) {
    if (!record) return;
    await LivingAppsService.updateSchichteinteilungEntry(record.record_id, fields);
    await loadData();
    setEditing(false);
  }

  async function handleDelete() {
    if (!record) return;
    await LivingAppsService.deleteSchichteinteilungEntry(record.record_id);
    setDeleteOpen(false);
    navigate('/schichteinteilung');
  }

  function getUnternehmensverwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const refId = extractRecordId(url);
    return unternehmensverwaltungList.find(r => r.record_id === refId)?.fields.unternehmen_name ?? '—';
  }

  function getSchichtartenverwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const refId = extractRecordId(url);
    return schichtartenverwaltungList.find(r => r.record_id === refId)?.fields.schichtart_name ?? '—';
  }

  function getMitarbeiterverwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const refId = extractRecordId(url);
    return mitarbeiterverwaltungList.find(r => r.record_id === refId)?.fields.mitarbeiter_vorname ?? '—';
  }

  if (loading) {
    return <RecordViewSkeleton />;
  }

  if (!record) {
    return (
      <RecordViewEmpty
        title={t('not_found')}
        action={
          <Button variant="ghost" onClick={() => navigate('/schichteinteilung')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            {t('back')}
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/schichteinteilung')}
      onEdit={() => setEditing(true)}
      backLabel={t('back')}
      editLabel={t('edit_button')}
    >
      <RecordHeader title={record.fields.zuweisung_ende ?? appLabel('schichteinteilung')} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
          zuweisung_unternehmen: unternehmensverwaltungList,
          zuweisung_schichtart: schichtartenverwaltungList,
          zuweisung_mitarbeiter: mitarbeiterverwaltungList,
        };
        const fmtComputed = (k: string, n: number) =>
          /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k)
            ? n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
        const computedFacts = Object.entries(formEnhancements.computed)
          .map(([key, formula]) => {
            const v = evalComputed(formula, record!.fields as Record<string, unknown>, { lookupLists });
            return v != null
              ? { label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), value: fmtComputed(key, v) }
              : null;
          })
          .filter((f): f is { label: string; value: string } => f !== null);
        return computedFacts.length > 0 ? <RecordKeyFacts items={computedFacts} /> : null;
      })()}

      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_notiz')} value={record.fields.zuweisung_notiz} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_ende')} value={record.fields.zuweisung_ende} format="text" />
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_datum')} value={record.fields.zuweisung_datum} format="date" />
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_unternehmen')} value={getUnternehmensverwaltungDisplayName(record.fields.zuweisung_unternehmen)} format="text" />
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_schichtart')} value={getSchichtartenverwaltungDisplayName(record.fields.zuweisung_schichtart)} format="text" />
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_beginn')} value={record.fields.zuweisung_beginn} format="text" />
        <RecordField label={fieldLabel('schichteinteilung', 'zuweisung_mitarbeiter')} value={getMitarbeiterverwaltungDisplayName(record.fields.zuweisung_mitarbeiter)} format="text" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.SCHICHTEINTEILUNG} recordId={record.record_id} />

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          {t('delete')}
        </Button>
      </div>

      <SchichteinteilungDialog
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={handleUpdate}
        defaultValues={record.fields}
        recordId={record.record_id}
        unternehmensverwaltungList={unternehmensverwaltungList}
        schichtartenverwaltungList={schichtartenverwaltungList}
        mitarbeiterverwaltungList={mitarbeiterverwaltungList}
        enablePhotoScan={AI_PHOTO_SCAN['Schichteinteilung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schichteinteilung']}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('delete_entity', { entity: appLabel('schichteinteilung') })}
        description={t('confirm_delete_desc')}
      />
    </RecordView>
  );
}
