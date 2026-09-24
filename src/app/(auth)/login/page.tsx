'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { loginAction } from '@/server/actions/auth.actions';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pesan, setPesan] = useState<{ text: string; type: 'error' | 'success' | '' }>({
    text: '',
    type: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPesan({ text: '', type: '' });

    if (!identifier.trim() || !password) {
      setPesan({ text: 'Email/username dan password wajib diisi.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const res = await loginAction({ identifier: identifier.trim(), password });
      if (!res.success) {
        setPesan({
          text: res.error || 'Email/username atau password tidak sesuai.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      setPesan({ text: 'Login berhasil. Membuka KESIT Management...', type: 'success' });

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 350);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat login.';
      setPesan({
        text: message,
        type: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-box">K</div>

        <h1>KESIT Management</h1>

        <p className="subtitle">Sistem Internal KESIT</p>

        <form id="loginForm" onSubmit={handleSubmit}>
          <label htmlFor="email">Email atau username</label>
          <input
            type="text"
            id="email"
            placeholder="Email atau username"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="Masukkan password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {pesan.text && (
          <div
            id="pesanLogin"
            className={`login-alert ${pesan.type === 'success' ? 'sukses' : 'gagal'}`}
            role="alert"
          >
            {pesan.type === 'success' ? (
              <CheckCircle2 size={18} className="login-alert-icon" />
            ) : (
              <AlertCircle size={18} className="login-alert-icon" />
            )}
            <span>{pesan.text}</span>
          </div>
        )}

        <div className="login-footer">KESIT Management</div>
      </div>
    </div>
  );
}
