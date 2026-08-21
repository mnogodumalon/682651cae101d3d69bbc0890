import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Unternehmensverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import {
  RecordView, RecordHeader, RecordKeyFacts, RecordSection, RecordField,
  RecordAttachments, RecordViewSkeleton, RecordViewEmpty,
} from '@/components/widgets/RecordView';
import { UnternehmensverwaltungDialog } from '@/components/dialogs/UnternehmensverwaltungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { formEnhancements } from '@/config/form-enhancements/Unternehmensverwaltung';
import { evalComputed } from '@/config/form-enhancements/types';
import { t, appLabel, fieldLabel, localeTag, CURRENCY } from '@/i18n';

export default function UnternehmensverwaltungDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Unternehmensverwaltung | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const list = await LivingAppsService.getUnternehmensverwaltung();
      setRecord(list.find(r => r.record_id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(fields: Unternehmensverwaltung['fields']) {
    if (!record) return;
    await LivingAppsService.updateUnternehmensverwaltungEntry(record.record_id, fields);
    await loadData();
    setEditing(false);
  }

  async function handleDelete() {
    if (!record) return;
    await LivingAppsService.deleteUnternehmensverwaltungEntry(record.record_id);
    setDeleteOpen(false);
    navigate('/unternehmensverwaltung');
  }

  if (loading) {
    return <RecordViewSkeleton />;
  }

  if (!record) {
    return (
      <RecordViewEmpty
        title={t('not_found')}
        action={
          <Button variant="ghost" onClick={() => navigate('/unternehmensverwaltung')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            {t('back')}
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/unternehmensverwaltung')}
      onEdit={() => setEditing(true)}
      backLabel={t('back')}
      editLabel={t('edit_button')}
    >
      <RecordHeader title={record.fields.unternehmen_name ?? appLabel('unternehmensverwaltung')} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
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
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_name')} value={record.fields.unternehmen_name} format="text" />
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_plz')} value={record.fields.unternehmen_plz} format="text" />
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_notiz')} value={record.fields.unternehmen_notiz} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_ort')} value={record.fields.unternehmen_ort} format="text" />
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_strasse')} value={record.fields.unternehmen_strasse} format="text" />
        <RecordField label={fieldLabel('unternehmensverwaltung', 'unternehmen_hausnummer')} value={record.fields.unternehmen_hausnummer} format="text" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.UNTERNEHMENSVERWALTUNG} recordId={record.record_id} />

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          {t('delete')}
        </Button>
      </div>

      <UnternehmensverwaltungDialog
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={handleUpdate}
        defaultValues={record.fields}
        recordId={record.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Unternehmensverwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Unternehmensverwaltung']}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('delete_entity', { entity: appLabel('unternehmensverwaltung') })}
        description={t('confirm_delete_desc')}
      />
    </RecordView>
  );
}
