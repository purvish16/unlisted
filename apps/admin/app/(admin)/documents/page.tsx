'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';

// In a real app this would fetch from admin documents endpoint
// For now we show the review interface with mock structure

type DocStatus = 'pending' | 'approved' | 'rejected';

interface PendingDoc {
  id: string;
  company: string;
  documentType: string;
  fileUrl: string;
  verificationStatus: DocStatus;
  submittedAt: string;
}

const MOCK_DOCS: PendingDoc[] = [];

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<PendingDoc | null>(null);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: ({ status }: { status: 'approved' | 'rejected' }) =>
      adminApi.verifyDocument(selectedDoc!.id, status, notes || undefined),
    onSuccess: (_, { status }) => {
      setFeedback(`Document ${status} successfully.`);
      setSelectedDoc(null);
      setNotes('');
    },
    onError: (err: unknown) => setFeedback(err instanceof Error ? err.message : 'Failed'),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-on-surface">Document Verification</h1>
        <p className="text-[14px] text-outline mt-1">
          Review and verify company documents for listing approval
        </p>
      </div>

      {feedback && (
        <div className="bg-secondary/10 text-secondary text-[13px] font-semibold rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {feedback}
          <button onClick={() => setFeedback(null)} className="ml-auto">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-container-lowest rounded-xl p-1 shadow-ambient w-fit">
        {(['pending', 'approved', 'rejected'] as DocStatus[]).map((s) => (
          <button
            key={s}
            className="px-4 py-1.5 rounded-lg text-[13px] font-semibold text-on-surface-variant hover:text-on-surface capitalize"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
        {MOCK_DOCS.length === 0 ? (
          <EmptyState
            icon="description"
            title="No documents pending review"
            description="Company documents submitted for verification will appear here."
          />
        ) : (
          <div className="divide-y divide-surface-container-low">
            {MOCK_DOCS.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-outline text-[18px]">description</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-on-surface">{doc.company}</p>
                  <p className="text-[12px] text-outline capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
                </div>
                <Badge variant={doc.verificationStatus === 'approved' ? 'approved' : doc.verificationStatus === 'rejected' ? 'rejected' : 'pending'}>
                  {doc.verificationStatus}
                </Badge>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:opacity-70 transition-opacity">
                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                </a>
                {doc.verificationStatus === 'pending' && (
                  <button
                    onClick={() => { setSelectedDoc(doc); setNotes(''); }}
                    className="text-primary font-bold text-[12px] px-3 py-1 bg-primary/5 rounded hover:bg-primary/10 transition-colors"
                  >
                    Review
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to use note */}
      <div className="bg-primary/5 rounded-xl p-4 text-[13px] text-primary flex items-start gap-2">
        <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">info</span>
        <div>
          Documents are submitted via the Company Portal. Once submitted, they appear here for admin review.
          Approving a required document advances the company through the listing process.
        </div>
      </div>

      {/* Review modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedDoc(null)} />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-floating p-6 z-10">
            <h3 className="text-[18px] font-bold text-on-surface mb-1">Verify Document</h3>
            <p className="text-[14px] text-outline mb-5 capitalize">
              {selectedDoc.documentType.replace(/_/g, ' ')} · {selectedDoc.company}
            </p>
            <a
              href={selectedDoc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary font-semibold text-[13px] mb-4 hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              View Document
            </a>
            <div className="mb-4">
              <label className="text-[12px] font-bold uppercase tracking-wider text-outline block mb-2">
                Review Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-surface-container-high px-4 py-3 rounded-xl text-[14px] text-on-surface border-none focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => verifyMutation.mutate({ status: 'approved' })}
                disabled={verifyMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-bold bg-secondary text-white hover:opacity-90 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => verifyMutation.mutate({ status: 'rejected' })}
                disabled={verifyMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-bold bg-error text-white hover:opacity-90 disabled:opacity-60"
              >
                Reject
              </button>
              <button onClick={() => setSelectedDoc(null)} className="px-4 text-outline hover:text-on-surface">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
