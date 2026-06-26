import { storage } from './storage';
import { calcCalvingDate, calcBreedDate, nowISO } from './utils';
import type {
  Cattle, BreedingRecord, HealthRecord, FinanceRecord, FarmSettings,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

const defaultSettings: FarmSettings = {
  farmName: '', ownerName: '', address: '', phone: '', email: '', website: '', logoPath: '',
};

// ─── CATTLE ────────────────────────────────────────────────────────────────

export async function getAllCattle(): Promise<Cattle[]> {
  return storage.readTable<Cattle>('cattle');
}

export async function getActiveCattle(): Promise<Cattle[]> {
  return (await getAllCattle()).filter((c) => c.status === 'active');
}

export async function getCattleByTag(tagNumber: string): Promise<Cattle | undefined> {
  return (await getAllCattle()).find((c) => c.tagNumber === tagNumber);
}

export async function createCattle(data: Omit<Cattle, 'createdAt' | 'updatedAt'>): Promise<Cattle> {
  const all = await getAllCattle();
  const now = nowISO();
  const record: Cattle = { ...data, createdAt: now, updatedAt: now };
  await storage.writeTable('cattle', [...all, record]);
  return record;
}

export async function updateCattle(tagNumber: string, data: Partial<Cattle>): Promise<Cattle | null> {
  const all = await getAllCattle();
  const idx = all.findIndex((c) => c.tagNumber === tagNumber);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...data, updatedAt: nowISO() };
  all[idx] = updated;
  await storage.writeTable('cattle', all);
  return updated;
}

export async function softDeleteCattle(tagNumber: string): Promise<boolean> {
  const result = await updateCattle(tagNumber, { status: 'archived' });
  return result !== null;
}

// ─── BREEDING ──────────────────────────────────────────────────────────────

export async function getAllBreeding(): Promise<BreedingRecord[]> {
  return storage.readTable<BreedingRecord>('breeding');
}

export async function getBreedingById(id: string): Promise<BreedingRecord | undefined> {
  return (await getAllBreeding()).find((b) => b.id === id);
}

export async function getBreedingByCow(cowTagNumber: string): Promise<BreedingRecord[]> {
  return (await getAllBreeding()).filter((b) => b.cowTagNumber === cowTagNumber);
}

export async function createBreeding(data: Omit<BreedingRecord, 'id' | 'possibleCalvingDate' | 'createdAt' | 'updatedAt'>): Promise<BreedingRecord> {
  const all = await getAllBreeding();
  const now = nowISO();
  const record: BreedingRecord = {
    ...data,
    id: uuidv4(),
    possibleCalvingDate: calcCalvingDate(data.breedDate),
    createdAt: now,
    updatedAt: now,
  };
  await storage.writeTable('breeding', [...all, record]);
  return record;
}

export async function updateBreeding(id: string, data: Partial<BreedingRecord>): Promise<BreedingRecord | null> {
  const all = await getAllBreeding();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...data, updatedAt: nowISO() };
  if (data.breedDate && data.breedDate !== all[idx].breedDate) {
    updated.possibleCalvingDate = calcCalvingDate(data.breedDate);
  }
  // If actual calving date is provided/changed, derive the breedDate from it
  if (data.actualCalvingDate && data.actualCalvingDate !== all[idx].actualCalvingDate) {
    updated.breedDate = calcBreedDate(data.actualCalvingDate);
    // when actual calving date is known, update possibleCalvingDate to match actual
    updated.possibleCalvingDate = data.actualCalvingDate;
  }
  all[idx] = updated;
  await storage.writeTable('breeding', all);
  return updated;
}

export async function deleteBreeding(id: string): Promise<boolean> {
  const all = await getAllBreeding();
  const filtered = all.filter((b) => b.id !== id);
  if (filtered.length === all.length) return false;
  await storage.writeTable('breeding', filtered);
  return true;
}

// Auto-create breeding record when adding a calf with known dam
export async function autoCreateBreedingForCalf(calf: Cattle): Promise<void> {
  if (!calf.damTagNumber) return;
  await createBreeding({
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

export async function getAllHealth(): Promise<HealthRecord[]> {
  return storage.readTable<HealthRecord>('health');
}

export async function getHealthById(id: string): Promise<HealthRecord | undefined> {
  return (await getAllHealth()).find((h) => h.id === id);
}

export async function createHealth(data: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthRecord> {
  const all = await getAllHealth();
  const now = nowISO();
  const record: HealthRecord = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
  await storage.writeTable('health', [...all, record]);
  return record;
}

export async function updateHealth(id: string, data: Partial<HealthRecord>): Promise<HealthRecord | null> {
  const all = await getAllHealth();
  const idx = all.findIndex((h) => h.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...data, updatedAt: nowISO() };
  all[idx] = updated;
  await storage.writeTable('health', all);
  return updated;
}

export async function deleteHealth(id: string): Promise<boolean> {
  const all = await getAllHealth();
  const filtered = all.filter((h) => h.id !== id);
  if (filtered.length === all.length) return false;
  await storage.writeTable('health', filtered);
  return true;
}

// ─── FINANCES ──────────────────────────────────────────────────────────────

export async function getAllFinances(): Promise<FinanceRecord[]> {
  return storage.readTable<FinanceRecord>('finances');
}

export async function getFinanceById(id: string): Promise<FinanceRecord | undefined> {
  return (await getAllFinances()).find((f) => f.id === id);
}

export async function createFinance(data: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinanceRecord> {
  const all = await getAllFinances();
  const now = nowISO();
  const record: FinanceRecord = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
  await storage.writeTable('finances', [...all, record]);
  return record;
}

export async function updateFinance(id: string, data: Partial<FinanceRecord>): Promise<FinanceRecord | null> {
  const all = await getAllFinances();
  const idx = all.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...data, updatedAt: nowISO() };
  all[idx] = updated;
  await storage.writeTable('finances', all);
  return updated;
}

export async function deleteFinance(id: string): Promise<boolean> {
  const all = await getAllFinances();
  const filtered = all.filter((f) => f.id !== id);
  if (filtered.length === all.length) return false;
  await storage.writeTable('finances', filtered);
  return true;
}

// ─── SETTINGS ──────────────────────────────────────────────────────────────

export async function getSettings(): Promise<FarmSettings> {
  return storage.readSettings<FarmSettings>(defaultSettings);
}

export async function saveSettings(data: FarmSettings): Promise<FarmSettings> {
  await storage.writeSettings(data);
  return data;
}
