'use client';

import { useQuery } from '@tanstack/react-query';
import { companyApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';

const DOC_ICONS: Record<string, string> = {
  incorporation_certificate: 'apartment',
  pan_card: 'badge',
  gst_certificate: 'receipt_long',
  audited_financials: 'bar_chart',
  board_resolution: 'gavel',
  pitch_deck: 'present_to_all',
  other: 'description',
};

const REQUIRED_DOCS = [
  { type: 'incorporation_certificate', label: 'Certificate of Incorporation' },
  { type: 'pan_card',                  label: 'Company PAN Card' },
  { type: 'audited_financials',        label: 'Audited Financials (Last 2 years)' },
  { type: 'board_resolution',          label: 'Board Resolution' },
  { type: 'pitch_deck',                label: 'Pitch Deck' },
];

export default function DocumentsPage() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['company-documents'],
    queryFn: companyApi.getDocuments,
  });

  const uploadedTypes = new Set(documents?.map((d) => d.documentType) ?? []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-on-surface">Documents</h1>
          <p className="text-[14px] text-outline mt-1">
            Upload and manage company documents for verification and listing
          </p>
        </div>
        <button className="btn-primary text-[13px] py-2 px-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">upload</span>
          Upload Document
        </button>
      </div>

      {/* Required checklist */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6">
        <h2 className="text-[16px] font-semibold text-on-surface mb-4">Required Documents</h2>
        <div className="space-y-3">
          {REQUIRED_DOCS.map((req) => {
            const uploaded = uploadedTypes.has(req.type);
            return (
              <div
                key={req.type}
                className={`flex items-center gap-4 p-3 rounded-xl ${
                  uploaded ? 'bg-secondary/5' : 'bg-surface-container-low'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  uploaded ? 'bg-secondary/20' : 'bg-surface-container-high'
                }`}>
                  <span className={`material-symbols-outlined text-[18px] ${uploaded ? 'text-secondary' : 'text-outline'}`}>
                    {uploaded ? 'check_circle' : DOC_ICONS[req.type] ?? 'description'}
                  </span>
                </div>
                <span className={`flex-1 text-[14px] font-semibold ${uploaded ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {req.label}
                </span>
                {uploaded ? (
                  <Badge variant="approved">Uploaded</Badge>
                ) : (
                  <button className="text-primary font-bold text-[12px] px-3 py-1 bg-primary/5 rounded hover:bg-primary/10 transition-colors">
                    Upload
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-surface-container-low">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-outline">
              {uploadedTypes.size} of {REQUIRED_DOCS.length} required documents uploaded
            </span>
            <div className="w-32 h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                style={{ width: `${(uploadedTypes.size / REQUIRED_DOCS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* All documents */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        <div className="p-5 border-b border-surface-container-low">
          <h2 className="text-[16px] font-semibold text-on-surface">All Documents</h2>
        </div>
        {isLoading ? (
          <div className="p-6 animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-surface-container-high rounded-lg" />
            ))}
          </div>
        ) : !documents?.length ? (
          <EmptyState
            icon="folder_open"
            title="No documents uploaded"
            description="Upload your company documents to start the verification process."
          />
        ) : (
          <div className="divide-y divide-surface-container-low">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low/50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-outline text-[18px]">
                    {DOC_ICONS[doc.documentType] ?? 'description'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-on-surface capitalize">
                    {doc.documentType.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] text-outline">Uploaded {formatDate(doc.createdAt)}</p>
                </div>
                <Badge variant={
                  doc.verificationStatus === 'approved' ? 'approved' :
                  doc.verificationStatus === 'rejected' ? 'rejected' : 'pending'
                }>
                  {doc.verificationStatus}
                </Badge>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
