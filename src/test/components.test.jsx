import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SplashModal from '../components/SplashModal';
import LoginModal from '../components/LoginModal';

describe('React Component & UI Modal Logic Tests', () => {
  it('SplashModal - Renders branding text and triggers onClose when clicked', () => {
    const handleClose = vi.fn();
    render(<SplashModal onClose={handleClose} />);

    expect(screen.getByText(/Stand Up PaddleLog/i)).toBeInTheDocument();
    expect(screen.getByText(/Every Stroke Has A Story/i)).toBeInTheDocument();

    const textEl = screen.getByText(/Ketuk layar untuk memulai/i);
    fireEvent.click(textEl);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('LoginModal - Renders login form and toggles between login and register', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    render(<LoginModal onClose={handleClose} onLoginSuccess={handleSuccess} />);

    expect(screen.getByText(/AKUN SUP.ID INDONESIA/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /MASUK SEKARANG/i })).toBeInTheDocument();

    // Toggle to Register mode
    const registerTab = screen.getByText(/Daftar \(Register\)/i);
    fireEvent.click(registerTab);

    expect(screen.getByRole('button', { name: /KIRIM PENDAFTARAN/i })).toBeInTheDocument();
  });
});
