import React from 'react';

export function Skeleton({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`skeleton-shimmer ${className}`} style={style} />;
}

export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card skeleton-card">
          <div className="skeleton-icon skeleton-shimmer" />
          <div className="skeleton-text-group">
            <div className="skeleton-shimmer skeleton-line-title" />
            <div className="skeleton-shimmer skeleton-line-sub" />
          </div>
        </div>
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="skeleton-row">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <div
                className="skeleton-shimmer skeleton-cell"
                style={{
                  width: c === 0 ? '70%' : c === cols - 1 ? '40%' : '55%',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
