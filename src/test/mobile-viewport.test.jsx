import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

import HomeScreen from '../components/HomeScreen';
import PassportScreen from '../components/PassportScreen';
import GearLockerScreen from '../components/GearLockerScreen';

describe('Mobile Viewport & Screen Responsiveness Suite', () => {
  const dummyUser = { id: 1, name: 'Ferdhy Mobile Tester', email: 'mobile@example.com' };
  const mockNavigate = vi.fn();

  const setViewport = (width, height) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
    window.dispatchEvent(new Event('resize'));
  };

  // ── 1. Mobile Small (360x640 - Android Low-End) ──
  it('Mobile Responsiveness 1: HomeScreen renders cleanly on Mobile Small (360x640)', async () => {
    setViewport(360, 640);
    await act(async () => {
      render(<HomeScreen user={dummyUser} onNavigate={mockNavigate} onOpenLogin={vi.fn()} onOpenAllActivities={vi.fn()} />);
    });
    expect(screen.getByText(/Activity Feed/i)).toBeInTheDocument();
  });

  // ── 2. Mobile Medium (390x844 - iPhone 13/14/15) ──
  it('Mobile Responsiveness 2: PassportScreen renders cleanly on iPhone 14 Viewport (390x844)', async () => {
    setViewport(390, 844);
    await act(async () => {
      render(<PassportScreen user={dummyUser} onNavigate={mockNavigate} />);
    });
    expect(screen.getByText(/MY PASSPORT/i)).toBeInTheDocument();
  });

  // ── 3. Mobile Large (412x915 - Samsung Galaxy S23) ──
  it('Mobile Responsiveness 3: GearLockerScreen renders cleanly on Samsung Galaxy S23 (412x915)', async () => {
    setViewport(412, 915);
    await act(async () => {
      render(<GearLockerScreen user={dummyUser} onNavigate={mockNavigate} />);
    });
    expect(screen.getByText(/Gear Locker/i)).toBeInTheDocument();
  });
});
