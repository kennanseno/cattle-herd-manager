import { readCSV, writeCSV, readSettings, writeSettings } from './csv';
import { calcCalvingDate, calcBreedDate, nowISO } from './utils';
import type {
  Cattle, BreedingRecord, HealthRecord, FinanceRecord, FarmSettings,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

const defaultSettings: FarmSettings = {
  farmName: '', ownerName: '', address: '', phone: '', email: '', logoPath: '',
};

// ─── CATTLE ────────────────────────────────────────────────────────────────

export function getAllCattle(): Cattle[] {
  return readCSV<Cattle>('cattle.csv');
}

export function getActiveCattle(): Cattle[] {
  return getAllCattle().filter((c) => c.status === 'active');
}

export function getCattleByTag(tagNumber: string): Cattle | undefined {
  return getAllCattle().find((c) => c.tagNumber === tagNumber);
}

export function createCattle(data: Omit<Cattle, 'createdAt' | 'updatedAt'>): Cattle {
  const all = getAllCattle();
  const now = nowISO();
  const record: Cattle = { ...data, createdAt: now, updatedAt: now };
  writeCSV('cattle.csv', [...all, record]);
  return record;
}

export function updateCattle(tagNumber: string, data: Partial<Cattle>): Cattle | null {
  const all = getAllCattle();
  const idx = all.findIndex((c) => c.tagNumber === tagNumber);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...data, updatedAt: nowISO() };
  all[idx] = updated;
  writeCSV('cattle.csv', all);
  return updated;
}

export function softDeleteCattle(tagNumber: string): boolean {
  const result = updateCattle(tagNumber, { status: 'archived' });
  return result !== null;
}

// ─── BREEDING ──────────────────────────────────────────────────────────────

export function getAllBreeding(): BreedingRecord[] {
  return readCSV<BreedingRecord>('breeding.csv');
}

export function getBreedingById(id: string): BreedingRecord | undefined {
  return getAllBreeding().find((b) => b.id === id);
}

export function getBreedingByCow(cowTagNumber: string): BreedingRecord[] {
  return getAllBreeding().filter((b) => b.cowTagNumber === cowTagNumber);
}

export function createBreeding(data: Omit<BreedingRecord, 'id' | 'possibleCalvingDate' | 'createdAt' | 'updatedAt'>): BreedingRecord {
  const all = getAllBreeding();
  const now = nowISO();
  const record: BreedingRecord = {
    ...data,
    id: uuidv4(),
    possibleCalvingDate: calcCalvingDate(data.breedDate),
    createdAt: now,
    updatedAt: now,
  };
  writeCSV('breeding.csv', [...all, record]);
  return record;
}

export function updateBreeding(id: string, data: Partial<BreedingRecord>): BreedingRecord | null {
  const all = getAllBreeding();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...data, updatedAt: nowISO() };
  if (data.breedDate && data.breedDate !== all[idx].breedDate) {
    updated.possibleCalvingDate = calcCalvingDate(data.breedDate);
  }
  all[idx] = updated;
  writeCSV('breeding.csv', all);
  return updated;
}

export function deleteBreeding(id: string): boolean {
  const all = getAllBreeding();
  const filtered = all.filter((b) => b.id !== id);
  if (filtered.length === all.length) return false;
  writeCSV('breeding.csv', filtered);
  return true;
}

// Auto-create breeding record when adding a calf with known dam
export function autoCreateBreedingForCalf(calf: Cattle): void {
  if (!calf.damTagNumber) return;
  createBreeding({
    cowTagNumber: calf.damTagNumber,
    sireTagNumber: calf.sireTagNumber || '',
    breedDate: calcBreedDate(calf.dateOfBirth),
    actualCalvingDate: calf.dateOfBirth,
    calfTagNumber: calf.tagNumber,
    notes: `Auto-created from calf ${calf.tagNumber}`,
    status: 'calved',
  });
}

// ─── HEALTH ────────────────────────────────────────────────────────────────

export function getAllHealth(): HealthRecord[] {
  return readCSV<HealthRecord>('health.csv');
}

export function getHealthById(id: string): HealthRecord | undefined {
  return getAllHealth().find((h) => h.id === id);
}

export function createHealth(data: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>): HealthRecord {
  const all = getAllHealth();
  const now = nowISO();
  const record: HealthRecord = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
  writeCSV('health.csv', [...all, record]);
  return record;
}

export function updateHealth(id: string, data: Partial<HealthRecord>): HealthRecord | null {
  const all = getAllHealth();
  const idx = all.findIndex((h) => h.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...data, updatedAt: nowISO() };
  all[idx] = updated;
  writeCSV('health.csv', all);
  return updated;
}

export function deleteHealth(id: string): boolean {
  const all = getAllHealth();
  const filtered = all.filter((h) => h.id !== id);
  if (filtered.length === all.length) return false;
  writeCSV('health.csv', filtered);
  return true;
}

// ─── FINANCES ──────────────────────────────────────────────────────────────

export function getAllFinances(): FinanceRecord[] {
  return readCSV<FinanceRecord>('finances.csv');
}

export function getFinanceById(id: string): FinanceRecord | undefined {
  return getAllFinances().find((f) => f.id === id);
}

export function createFinance(data: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'>): FinanceRecord {
  const all = getAllFinances();
  const now = nowISO();
  const record: FinanceRecord = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
  writeCSV('finances.csv', [...all, record]);
  return record;
}

export function updateFinance(id: string, data: Partial<FinanceRecord>): FinanceRecord | null {
  const all = getAllFinances();
  const idx = all.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...data, updatedAt: nowISO() };
  all[idx] = updated;
  writeCSV('finances.csv', all);
  return updated;
}

export function deleteFinance(id: string): boolean {
  const all = getAllFinances();
  const filtered = all.filter((f) => f.id !== id);
  if (filtered.length === all.length) return false;
  writeCSV('finances.csv', filtered);
  return true;
}

// ─── SETTINGS ──────────────────────────────────────────────────────────────

export function getSettings(): FarmSettings {
  return readSettings<FarmSettings>('settings.json', defaultSettings);
}

export function saveSettings(data: FarmSettings): FarmSettings {
  writeSettings('settings.json', data);
  return data;
}
