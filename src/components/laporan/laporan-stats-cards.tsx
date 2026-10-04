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
      label: 'Total Rapor Diterbitkan',
      value: stats.totalRapor,
      sublabel: 'Seluruh arsip penilaian',
      icon: FileText,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      accentColor: 'from-sky-500/10 to-transparent',
    },
    {
      label: 'Siswa Naik Tingkat / Lulus',
      value: stats.totalNaikLevel,
      sublabel: 'Rekomendasi level lanjutan',
      icon: Award,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      accentColor: 'from-emerald-500/10 to-transparent',
    },
    {
      label: 'Rata-rata Skor Siswa',
      value: `${stats.rataRataNilai.toFixed(2)} / 5.0`,
      sublabel: 'Skor rata-rata kompetensi',
      icon: Star,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      accentColor: 'from-amber-500/10 to-transparent',
    },
    {
      label: 'Draft Belum Difinalisasi',
      value: stats.totalDraft,
      sublabel: 'Menunggu review & approval',
      icon: Clock,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      accentColor: 'from-purple-500/10 to-transparent',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="relative overflow-hidden bg-[#181b21] border border-[#2a2f3a] rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm"
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.accentColor} rounded-full blur-2xl pointer-events-none -mr-10 -mt-10`}
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">{card.label}</p>
                <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight">
                  {card.value}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">{card.sublabel}</p>
              </div>
              <div
                className={`p-3 rounded-xl border ${card.iconBg} ${card.iconColor} shrink-0`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
