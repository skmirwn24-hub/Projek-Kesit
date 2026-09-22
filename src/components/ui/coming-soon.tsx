'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import { Topbar, BreadcrumbItem } from '@/components/layout/topbar';

export interface ComingSoonProps {
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  icon: LucideIcon;
  description: string;
  features?: string[];
}

export function ComingSoon({
  title,
  subtitle,
  breadcrumb,
  icon: Icon,
  description,
  features = [],
}: ComingSoonProps) {
  return (
    <>
      <Topbar
        title={title}
        subtitle={subtitle}
        breadcrumb={breadcrumb || [{ label: 'KESIT Management' }, { label: title }]}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 16px 80px',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Module Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'var(--bg-panel-soft)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              marginBottom: '20px',
            }}
          >
            <Icon size={30} />
          </div>

          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#fbbf24',
              }}
            />
            <span>Segera Hadir • Dalam Pengembangan</span>
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '8px',
            }}
          >
            {title}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: features.length > 0 ? '24px' : '32px',
              maxWidth: '440px',
            }}
          >
            {description}
          </p>

          {/* Feature List */}
          {features.length > 0 && (
            <div
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px 20px',
                textAlign: 'left',
                marginBottom: '28px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                  marginBottom: '10px',
                }}
              >
                Fungsionalitas yang Disiapkan:
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-main)',
                }}
              >
                {features.map((f, i) => (
                  <li key={i} style={{ lineHeight: 1.5 }}>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Back Button */}
          <Link
            href="/"
            className="secondary-btn"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </div>
    </>
  );
}
