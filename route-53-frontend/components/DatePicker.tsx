'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface DatePickerProps {
  value: string; // ISO date 'YYYY-MM-DD' or empty string
  onChange: (date: string) => void;
  min?: string; // ISO date 'YYYY-MM-DD'
  max?: string; // ISO date 'YYYY-MM-DD'
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
  clearable?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatIso(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseIso(isoStr?: string): { year: number; month: number; day: number } | null {
  if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return null;
  const [y, m, d] = isoStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function formatDisplayDate(isoStr?: string): string {
  const parsed = parseIso(isoStr);
  if (!parsed) return '';
  const dateObj = new Date(Date.UTC(parsed.year, parsed.month, parsed.day));
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function getTodayIso(): string {
  const now = new Date();
  return formatIso(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select event date...',
  label,
  id,
  className = '',
  clearable = true,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  // Initialize view month/year based on value or min or today
  const initialView = useMemo(() => {
    const fromVal = parseIso(value);
    if (fromVal) return { year: fromVal.year, month: fromVal.month };
    const fromMin = parseIso(min);
    if (fromMin) return { year: fromMin.year, month: fromMin.month };
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
  }, [value, min]);

  const [viewYear, setViewYear] = useState<number>(initialView.year);
  const [viewMonth, setViewMonth] = useState<number>(initialView.month);

  // Synchronize view when popover opens or value changes
  useEffect(() => {
    if (isOpen) {
      const parsed = parseIso(value);
      if (parsed) {
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
      }
    }
  }, [isOpen, value]);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const todayIso = useMemo(() => getTodayIso(), []);

  // Compute calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

    const days: Array<{
      day: number;
      iso: string;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Blank cells before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        day: 0,
        iso: '',
        isDisabled: true,
        isSelected: false,
        isToday: false,
      });
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = formatIso(viewYear, viewMonth, d);
      const isBeforeMin = min ? iso < min : false;
      const isAfterMax = max ? iso > max : false;
      const isDisabled = isBeforeMin || isAfterMax;
      const isSelected = value === iso;
      const isToday = todayIso === iso;

      days.push({
        day: d,
        iso,
        isDisabled,
        isSelected,
        isToday,
      });
    }

    return days;
  }, [viewYear, viewMonth, min, max, value, todayIso]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (iso: string) => {
    onChange(iso);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Quick preset shortcuts
  const selectPreset = (type: 'today' | 'tomorrow' | 'weekend' | 'nextWeek') => {
    const now = new Date();
    const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (type === 'tomorrow') {
      target.setUTCDate(target.getUTCDate() + 1);
    } else if (type === 'weekend') {
      // Find upcoming Saturday
      const day = target.getUTCDay();
      const diff = day === 6 ? 7 : (6 - day);
      target.setUTCDate(target.getUTCDate() + diff);
    } else if (type === 'nextWeek') {
      target.setUTCDate(target.getUTCDate() + 7);
    }

    const iso = formatIso(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
    if (min && iso < min) return;
    onChange(iso);
    setIsOpen(false);
  };

  const displayString = formatDisplayDate(value);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        id={inputId}
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`recessed-channel w-full rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-all select-none group ${
          isOpen ? 'ring-1 ring-[#D9AE54]/70 border-[#D9AE54]/50' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="text-[#D9AE54] text-xs shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>

          {value ? (
            <span className="text-xs font-mono font-semibold text-zinc-100 truncate">
              {displayString}
            </span>
          ) : (
            <span className="text-xs text-zinc-500 truncate font-normal">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date"
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          <svg
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#D9AE54]' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Architectural Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-[#141417] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-4 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Presets Ribbon */}
          <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-white/[0.06] overflow-x-auto text-[10px] font-mono">
            <button
              type="button"
              onClick={() => selectPreset('today')}
              className="px-2 py-1 rounded-md bg-[#1d1d22] text-zinc-300 hover:text-white hover:bg-[#28282f] border border-white/5 transition-colors whitespace-nowrap"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => selectPreset('tomorrow')}
              className="px-2 py-1 rounded-md bg-[#1d1d22] text-zinc-300 hover:text-white hover:bg-[#28282f] border border-white/5 transition-colors whitespace-nowrap"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => selectPreset('weekend')}
              className="px-2 py-1 rounded-md bg-[#1d1d22] text-zinc-300 hover:text-white hover:bg-[#28282f] border border-white/5 transition-colors whitespace-nowrap"
            >
              Weekend
            </button>
            <button
              type="button"
              onClick={() => selectPreset('nextWeek')}
              className="px-2 py-1 rounded-md bg-[#1d1d22] text-zinc-300 hover:text-white hover:bg-[#28282f] border border-white/5 transition-colors whitespace-nowrap"
            >
              +1 Week
            </button>
          </div>

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between pb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="font-serif font-bold text-sm tracking-wide text-zinc-100">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase tracking-wider text-zinc-500 pb-2">
            {WEEKDAY_NAMES.map((name) => (
              <div key={name} className="py-1">
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              if (cell.day === 0) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }

              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={cell.isDisabled}
                  onClick={() => handleSelectDate(cell.iso)}
                  className={`h-8 w-full rounded-lg text-xs font-mono transition-all flex items-center justify-center relative cursor-pointer ${
                    cell.isDisabled
                      ? 'text-zinc-600 opacity-30 cursor-not-allowed line-through'
                      : cell.isSelected
                        ? 'btn-volumetric-gold font-bold scale-105 shadow-md shadow-[#D9AE54]/30'
                        : 'text-zinc-300 hover:bg-white/[0.08] hover:text-[#D9AE54]'
                  } ${
                    cell.isToday && !cell.isSelected
                      ? 'border border-[#D9AE54]/40 font-semibold text-[#D9AE54]'
                      : ''
                  }`}
                >
                  {cell.day}
                  {cell.isToday && !cell.isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#D9AE54]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Telemetry */}
          <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>
              {value ? (
                <span className="text-zinc-300">
                  Selected: <strong className="text-[#D9AE54]">{value}</strong>
                </span>
              ) : (
                <span className="text-zinc-500">UTC Synchronized</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] uppercase font-bold text-zinc-300 hover:text-white px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

