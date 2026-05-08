'use client';

import React from 'react';

interface PriorityBadgeProps {
  score: number;
  semester?: number | null;
}

export default function PriorityBadge({ score, semester }: PriorityBadgeProps) {
  let label: string;
  let classes: string;

  if (score >= 40 || (semester && semester >= 8)) {
    label = 'Prioritas Tinggi';
    classes = 'bg-red-100 text-red-700 border-red-200';
  } else if (score >= 20) {
    label = 'Prioritas Sedang';
    classes = 'bg-yellow-100 text-yellow-700 border-yellow-200';
  } else {
    label = 'Prioritas Rendah';
    classes = 'bg-green-100 text-green-700 border-green-200';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      <span className="font-bold">{score.toFixed(1)}</span> · {label}
    </span>
  );
}
