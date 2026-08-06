import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import HomeScreen from '../components/HomeScreen';
import PassportScreen from '../components/PassportScreen';
import GearLockerScreen from '../components/GearLockerScreen';
import AdminDashboardScreen from '../components/AdminDashboardScreen';
import StatisticsScreen from '../components/StatisticsScreen';

import SpotDetailModal from '../components/SpotDetailModal';
import SafetyCheckModal from '../components/SafetyCheckModal';
import GearDetailModal from '../components/GearDetailModal';
import EditProfileModal from '../components/EditProfileModal';

describe('React Screens & Modals Full Test Suite', () => {
  const dummyUser = { id: 1, name: 'Ferdhy Tester', email: 'ferdhy@example.com', role: 'admin' };
  const mockNavigate = vi.fn();

  // ── 1. HomeScreen ──
  it('HomeScreen - Renders weather greeting hero card and feed tabs', () => {
    render(<HomeScreen user={dummyUser} onNavigate={mockNavigate} onOpenLogin={vi.fn()} onOpenAllActivities={vi.fn()} />);

    expect(screen.getByText(/Activity Feed/i)).toBeInTheDocument();
  });

  // ── 2. PassportScreen ──
  it('PassportScreen - Renders passport stats and paddle stamps grid', () => {
    render(<PassportScreen user={dummyUser} onNavigate={mockNavigate} />);

    expect(screen.getByText(/MY PASSPORT/i)).toBeInTheDocument();
    expect(screen.getByText(/OFFICIAL DIGITAL PASSPORT/i)).toBeInTheDocument();
  });

  // ── 3. GearLockerScreen ──
  it('GearLockerScreen - Renders gear items locker and add gear button', () => {
    render(<GearLockerScreen user={dummyUser} onNavigate={mockNavigate} />);

    expect(screen.getByText(/Gear Locker/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Tambah Gear/i)).toBeInTheDocument();
  });

  // ── 4. AdminDashboardScreen ──
  it('AdminDashboardScreen - Renders super admin panel metrics and user status tags', () => {
    render(<AdminDashboardScreen currentUser={dummyUser} />);

    expect(screen.getByText(/SUPER ADMIN/i)).toBeInTheDocument();
    expect(screen.getByText(/User & Access Panel/i)).toBeInTheDocument();
  });

  // ── 5. StatisticsScreen ──
  it('StatisticsScreen - Renders total paddle distance & monthly charts', () => {
    render(<StatisticsScreen user={dummyUser} onNavigate={mockNavigate} />);

    expect(screen.getByText(/Peringkat & Record/i)).toBeInTheDocument();
  });

  // ── 6. SpotDetailModal ──
  it('SpotDetailModal - Renders spot info and flyTo route action buttons', () => {
    const dummySpot = { id: 1, name: 'Pantai Losari Makassar', category: 'Ocean', lat: -5.143, lng: 119.458, address: 'Makassar, Sulawesi Selatan' };
    const handleClose = vi.fn();
    render(<SpotDetailModal spot={dummySpot} onClose={handleClose} onSelectAsDestination={vi.fn()} />);

    const spotTitles = screen.getAllByText(/Pantai Losari Makassar/i);
    expect(spotTitles.length).toBeGreaterThan(0);
    expect(spotTitles[0]).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /✕/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  // ── 7. SafetyCheckModal ──
  it('SafetyCheckModal - Renders safety checklist items before paddling', () => {
    const handleClose = vi.fn();
    render(<SafetyCheckModal onClose={handleClose} onConfirmStart={vi.fn()} />);

    expect(screen.getByText(/Safety Check/i)).toBeInTheDocument();
  });

  // ── 8. GearDetailModal ──
  it('GearDetailModal - Renders gear item specifications', () => {
    const dummyGear = { id: 1, name: 'Aqua Marina SUP Board 10.6', category: 'Board', brand: 'Aqua Marina', length: '10.6 ft', notes: 'Papan inflatable portable' };
    const handleClose = vi.fn();
    render(<GearDetailModal gear={dummyGear} onClose={handleClose} />);

    expect(screen.getByText(/Aqua Marina SUP Board 10.6/i)).toBeInTheDocument();
    expect(screen.getByText(/Board/i)).toBeInTheDocument();
  });

  // ── 9. EditProfileModal ──
  it('EditProfileModal - Renders profile editing fields', () => {
    const handleClose = vi.fn();
    render(<EditProfileModal user={dummyUser} onClose={handleClose} onSave={vi.fn()} />);

    expect(screen.getByText(/Edit Profil SUPer/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Ferdhy Tester/i)).toBeInTheDocument();
  });
});
