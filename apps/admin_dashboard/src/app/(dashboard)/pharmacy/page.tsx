'use client';

import { Modal } from '@/components/ui/Modal';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CenterSpinner,
  EmptyState,
  ErrorState,
  Label,
  PageHeader,
  Spinner,
  Textarea,
} from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { fetchBlobUrl } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { initials, prescriptionStatusColor, relativeTime, titleCase } from '@/lib/format';
import { usePendingPrescriptions, useVerifyPrescription } from '@/lib/queries';
import type { Prescription } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function PharmacyPage() {
  const { data, isLoading, isError, error, refetch } = usePendingPrescriptions();

  return (
    <div>
      <PageHeader
        title="Pharmacy — prescription review"
        subtitle="Review and verify customer prescriptions before pharmacy orders are dispatched."
      />

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Prescriptions are clinically reviewed here before any pharmacy order is shipped. Approve only legible, valid
        prescriptions; reject with a clear reason so the customer can re-upload.
      </div>

      {isError ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : isLoading ? (
        <CenterSpinner label="Loading prescriptions…" />
      ) : !data || data.length === 0 ? (
        <Card>
          <EmptyState
            title="No prescriptions to review"
            message="All caught up — new uploads will appear here as customers submit them."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <PrescriptionCard key={p.id} prescription={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  const { success, error: toastError } = useToast();
  const verify = useVerifyPrescription();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    setImageLoading(true);
    setImageError(false);

    fetchBlobUrl(prescription.imageUrl)
      .then((objectUrl) => {
        if (revoked) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        url = objectUrl;
        setImageUrl(objectUrl);
      })
      .catch(() => {
        if (!revoked) setImageError(true);
      })
      .finally(() => {
        if (!revoked) setImageLoading(false);
      });

    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [prescription.imageUrl]);

  const approve = () => {
    verify.mutate(
      { id: prescription.id, status: 'VERIFIED' },
      {
        onSuccess: () => success('Prescription approved'),
        onError: (e) => toastError((e as Error).message),
      },
    );
  };

  const submitReject = () => {
    verify.mutate(
      { id: prescription.id, status: 'REJECTED', rejectionReason: rejectionReason.trim() || undefined },
      {
        onSuccess: () => {
          success('Prescription rejected');
          setRejectOpen(false);
          setRejectionReason('');
        },
        onError: (e) => toastError((e as Error).message),
      },
    );
  };

  const customer = prescription.user;

  return (
    <Card className="flex flex-col">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-xs font-semibold text-brand-600">
              {initials(customer?.name, customer?.phone)}
            </span>
            <span>{customer?.name ?? 'Unknown customer'}</span>
          </div>
        }
        subtitle={customer?.phone ?? '—'}
        action={
          <Badge className={prescriptionStatusColor(prescription.status)}>{titleCase(prescription.status)}</Badge>
        }
      />

      <div className="px-5 py-4">
        <button
          type="button"
          onClick={() => imageUrl && setZoomOpen(true)}
          disabled={!imageUrl}
          className={cn(
            'flex h-44 w-full items-center justify-center overflow-hidden rounded-lg border border-surface-border bg-surface-subtle',
            imageUrl && 'cursor-zoom-in',
          )}
        >
          {imageLoading ? (
            <Spinner />
          ) : imageError ? (
            <span className="px-4 text-center text-xs text-ink-muted">Could not load prescription image</span>
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Prescription" className="h-full w-full object-contain" />
          ) : null}
        </button>

        <p className="mt-3 text-xs text-ink-muted">Uploaded {relativeTime(prescription.createdAt)}</p>
        {prescription.notes && <p className="mt-2 text-sm text-ink-soft">{prescription.notes}</p>}
      </div>

      <div className="mt-auto flex gap-2 border-t border-surface-border px-5 py-3">
        <Button variant="primary" size="sm" className="flex-1" loading={verify.isPending} onClick={approve}>
          Approve
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          disabled={verify.isPending}
          onClick={() => setRejectOpen(true)}
        >
          Reject
        </Button>
      </div>

      <Modal open={zoomOpen} onClose={() => setZoomOpen(false)} title="Prescription" size="lg">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Prescription" className="mx-auto max-h-[70vh] w-auto object-contain" />
        )}
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject prescription"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={verify.isPending}>
              Cancel
            </Button>
            <Button variant="danger" loading={verify.isPending} onClick={submitReject}>
              Reject prescription
            </Button>
          </>
        }
      >
        <Label htmlFor={`reject-${prescription.id}`}>Reason for rejection</Label>
        <Textarea
          id={`reject-${prescription.id}`}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="e.g. Image is blurry, prescription expired, doctor signature missing…"
        />
        <p className="mt-2 text-xs text-ink-muted">
          The customer will see this reason so they can re-upload a valid prescription.
        </p>
      </Modal>
    </Card>
  );
}
