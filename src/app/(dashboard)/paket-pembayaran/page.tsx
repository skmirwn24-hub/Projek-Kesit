'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PaketPembayaranRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/paket-pembayaran/spp');
  }, [router]);

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      color: 'var(--text-muted)',
    }}>
      <Loader2 className="animate-spin" size={32} />
      <span>Mengalihkan ke Pembayaran SPP...</span>
    </div>
  );
}
