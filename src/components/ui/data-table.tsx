'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Input } from './input';
import { Select } from './select';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  extraFilters?: React.ReactNode;
  actions?: React.ReactNode;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Cari data...',
  searchFilter,
  extraFilters,
  actions,
  isLoading,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    if (searchFilter) {
      return data.filter((item) => searchFilter(item, searchQuery.toLowerCase()));
    }
    return data.filter((item) =>
      Object.values(item).some((val) =>
        String(val || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery, searchFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="w-full space-y-4">
      {/* Top Filter and Actions Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#1b1e24] p-4 rounded-2xl border border-[#2d323c]">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-[#14161a] border border-[#2e333d] rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {extraFilters}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table Container */}
      <div className="bg-[#1b1e24] border border-[#2d323c] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#20242c] text-xs uppercase font-semibold text-slate-400 border-b border-[#2d323c]">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262b35]">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150"></div>
                      <span className="ml-2 text-xs">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-medium">Tidak ada data yang ditemukan</p>
                    <p className="text-xs text-slate-500 mt-0.5">Coba ubah kata kunci atau filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-[#232832]/60 transition-colors">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-4 py-3.5 ${col.className || ''}`}>
                        {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey] ?? '-') : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-t border-[#2d323c] bg-[#181a1f] text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#20242c] border border-[#303642] rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="ml-2">
              Menampilkan {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredData.length)} dari {filteredData.length} data
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-[#303642] text-slate-300 hover:bg-[#242934] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 text-slate-300 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-[#303642] text-slate-300 hover:bg-[#242934] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
