import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTime(date: string | Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function daysUntil(date: string | Date): number {
  if (!date) return 0;
  const target = new Date(date);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSLAStatus(dueDate: string | Date): 'on_track' | 'approaching' | 'breached' {
  if (!dueDate) return 'on_track';
  const days = daysUntil(dueDate);
  if (days < 0) return 'breached';
  if (days <= 3) return 'approaching';
  return 'on_track';
}

export function getRealTimeRemaining(dueDate: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isBreached: boolean;
  status: 'on_track' | 'approaching' | 'breached';
  formatted: string;
} {
  if (!dueDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isBreached: false,
      status: 'on_track',
      formatted: 'SLA: Active',
    };
  }

  const target = new Date(dueDate).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    const absMs = Math.abs(diffMs);
    const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      isBreached: true,
      status: 'breached',
      formatted: days > 0 ? `Breached by ${days}d ${hours}h` : `Breached by ${hours}h ${minutes}m ${seconds}s`,
    };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const status = days <= 3 ? 'approaching' : 'on_track';

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h ${minutes}m left`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s left`;
  } else {
    formatted = `${minutes}m ${seconds}s left`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isBreached: false,
    status,
    formatted,
  };
}
