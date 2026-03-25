interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="material-symbols-outlined text-[48px] text-outline/40 mb-4">{icon}</span>
      <h3 className="text-[16px] font-semibold text-on-surface mb-1">{title}</h3>
      {description && (
        <p className="text-[14px] text-outline max-w-[280px] leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
