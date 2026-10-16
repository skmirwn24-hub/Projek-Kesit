'use client';

import React from 'react';
import { FileText, Award, Star, Clock } from 'lucide-react';
import { LaporanStats } from '@/types/laporan';

interface LaporanStatsCardsProps {
  stats: LaporanStats;
}

export function LaporanStatsCards({ stats }: LaporanStatsCardsProps) {
  const cards = [
    {
      label: 'Total Rapor',
      sublabel: 'Seluruh arsip penilaian',
      value: stats.totalRapor,
      icon: FileText,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      gradient: 'from-sky-500/10 via-transparent to-transparent',
    },
    {
      label: 'Naik / Lulus',
      sublabel: 'Rekomendasi naik tingkat',
      value: stats.totalNaikLevel,
      icon: Award,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      gradient: 'from-emerald-500/10 via-transparent to-transparent',
    },
    {
      label: 'Rata-rata Skor',
      sublabel: 'Kompetensi teknik renang',
      value: `${Number(stats.rataRataNilai).toFixed(2)}`,
      unit: '/ 5.0',
      icon: Star,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      gradient: 'from-amber-500/10 via-transparent to-transparent',
    },
    {
      label: 'Draft Pending',
      sublabel: 'Menunggu finalisasi',
      value: stats.totalDraft,
      icon: Clock,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
      gradient: 'from-violet-500/10 via-transparent to-transparent',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="relative overflow-hidden bg-[#181b21] border border-[#2a2f3a] rounded-2xl p-3.5 sm:p-5 hover:border-slate-600 transition-all shadow-xs"
          >
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`}
            />

            <div className="relative flex flex-col justify-between h-full gap-3">
              {/* Icon + Label */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs sm:text-sm font-semibold text-slate-300 leading-tight">
                  {card.label}
                </p>
                <div
                  className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${card.iconBg} ${card.iconColor}`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Value + Sublabel */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-none">
                    {card.value}
                  </span>
                  {card.unit && (
                    <span className="text-xs sm:text-sm font-semibold text-slate-400">
                      {card.unit}
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1 sm:mt-1.5 leading-snug line-clamp-1">
                  {card.sublabel}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
