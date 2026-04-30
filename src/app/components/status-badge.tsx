interface StatusBadgeProps {
  status: 'complete' | 'incomplete' | 'missing';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    complete: 'bg-green-100 text-green-800',
    incomplete: 'bg-amber-100 text-amber-800',
    missing: 'bg-slate-100 text-slate-600',
  };

  const labels = {
    complete: 'Complete',
    incomplete: 'In Progress',
    missing: 'Not Started',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
