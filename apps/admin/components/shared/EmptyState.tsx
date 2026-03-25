interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="material-symbols-outlined text-[48px] text-outline/40">{icon}</span>
      <div className="text-center">
        <p className="text-[15px] font-semibold text-on-surface-variant">{title}</p>
        {description && <p className="text-[13px] text-outline mt-1 max-w-xs mx-auto">{description}</p>}
      </div>
      {action}
    </div>
  );
}
