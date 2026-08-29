export function calculateSLADeadline(startDate: Date, slaDays: number): Date {
  // Working day calculation (skip Sundays)
  const deadline = new Date(startDate);
  let added = 0;
  while (added < slaDays) {
    deadline.setDate(deadline.getDate() + 1);
    if (deadline.getDay() !== 0) added++; // Skip Sundays
  }
  return deadline;
}

export function getSLAStatus(dueDate: Date): 'on_track' | 'approaching' | 'breached' {
  const now = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'breached';
  if (diffDays <= 3) return 'approaching';
  return 'on_track';
}
