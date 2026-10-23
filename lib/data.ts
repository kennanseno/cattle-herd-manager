import { calcBreedDate, calcCalvingDate, nowISO } from "@/lib/utils";
import { getFarmContext } from "@/lib/supabase/farm";
import type {
  BreedingRecord,
  Cattle,
  FarmSettings,
  FinanceRecord,
  HealthRecord,
  PdfExportRecord,
} from "@/types";
import { v4 as uuidv4 } from "uuid";

const defaultSettings: FarmSettings = {
  farmName: "",
  ownerName: "",
  address: "",
  phone: "",
  email: "",
  website: "",
};

type DbRow = Record<string, unknown>;

function text(value: unknown): string {
  return value == null ? "" : String(value);
}

function nullableNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) throw new Error("Expected a finite numeric value.");
  return number;
}

function fromCattle(row: DbRow): Cattle {
  return {
    tagNumber: text(row.tag_number),
    nickname: text(row.nickname),
    dateOfBirth: text(row.date_of_birth),
    sireTagNumber: text(row.sire_tag_number),
    damTagNumber: text(row.dam_tag_number),
    sex: text(row.sex) as Cattle["sex"],
    breed: text(row.breed),
    birthWeight: text(row.birth_weight),
    weaningWeight: text(row.weaning_weight),
    notes: text(row.notes),
    status: text(row.status) as Cattle["status"],
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function toCattle(row: Partial<Cattle>) {
  return {
    ...(row.tagNumber !== undefined && { tag_number: row.tagNumber }),
    ...(row.nickname !== undefined && { nickname: row.nickname }),
    ...(row.dateOfBirth !== undefined && { date_of_birth: row.dateOfBirth }),
    ...(row.sireTagNumber !== undefined && { sire_tag_number: row.sireTagNumber }),
    ...(row.damTagNumber !== undefined && { dam_tag_number: row.damTagNumber }),
    ...(row.sex !== undefined && { sex: row.sex }),
    ...(row.breed !== undefined && { breed: row.breed }),
    ...(row.birthWeight !== undefined && { birth_weight: nullableNumber(row.birthWeight) }),
    ...(row.weaningWeight !== undefined && { weaning_weight: nullableNumber(row.weaningWeight) }),
    ...(row.notes !== undefined && { notes: row.notes }),
    ...(row.status !== undefined && { status: row.status }),
  };
}

function fromBreeding(row: DbRow): BreedingRecord {
  return {
    id: text(row.id),
    cowTagNumber: text(row.cow_tag_number),
    sireTagNumber: text(row.sire_tag_number),
    breedDate: text(row.breed_date),
    breedDateTo: text(row.breed_date_to),
    possibleCalvingDate: text(row.possible_calving_date),
    actualCalvingDate: text(row.actual_calving_date),
    calfTagNumber: text(row.calf_tag_number),
    notes: text(row.notes),
    status: text(row.status) as BreedingRecord["status"],
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function toBreeding(row: Partial<BreedingRecord>) {
  return {
    ...(row.id !== undefined && { id: row.id }),
    ...(row.cowTagNumber !== undefined && { cow_tag_number: row.cowTagNumber }),
    ...(row.sireTagNumber !== undefined && { sire_tag_number: row.sireTagNumber }),
    ...(row.breedDate !== undefined && { breed_date: row.breedDate }),
    ...(row.breedDateTo !== undefined && { breed_date_to: row.breedDateTo || null }),
    ...(row.possibleCalvingDate !== undefined && { possible_calving_date: row.possibleCalvingDate }),
    ...(row.actualCalvingDate !== undefined && { actual_calving_date: row.actualCalvingDate || null }),
    ...(row.calfTagNumber !== undefined && { calf_tag_number: row.calfTagNumber }),
    ...(row.notes !== undefined && { notes: row.notes }),
    ...(row.status !== undefined && { status: row.status }),
  };
}

function fromHealth(row: DbRow): HealthRecord {
  return {
    id: text(row.id),
    recordDate: text(row.record_date),
    vaccinationType: text(row.vaccination_type),
    tagNumbers: text(row.tag_numbers),
    veterinarian: text(row.veterinarian),
    cost: text(row.cost),
    notes: text(row.notes),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function toHealth(row: Partial<HealthRecord>) {
  return {
    ...(row.id !== undefined && { id: row.id }),
    ...(row.recordDate !== undefined && { record_date: row.recordDate }),
    ...(row.vaccinationType !== undefined && { vaccination_type: row.vaccinationType }),
    ...(row.tagNumbers !== undefined && { tag_numbers: row.tagNumbers }),
    ...(row.veterinarian !== undefined && { veterinarian: row.veterinarian }),
    ...(row.cost !== undefined && { cost: nullableNumber(row.cost) }),
    ...(row.notes !== undefined && { notes: row.notes }),
  };
}

function fromFinance(row: DbRow): FinanceRecord {
  return {
    id: text(row.id),
    date: text(row.date),
    dateTo: text(row.date_to),
    type: text(row.type) as FinanceRecord["type"],
    category: text(row.category),
    amount: text(row.amount),
    description: text(row.description),
    notes: text(row.notes),
    relatedTagNumber: text(row.related_tag_number),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function toFinance(row: Partial<FinanceRecord>) {
  return {
    ...(row.id !== undefined && { id: row.id }),
    ...(row.date !== undefined && { date: row.date }),
    ...(row.dateTo !== undefined && { date_to: row.dateTo || null }),
    ...(row.type !== undefined && { type: row.type }),
    ...(row.category !== undefined && { category: row.category }),
    ...(row.amount !== undefined && { amount: nullableNumber(row.amount) }),
    ...(row.description !== undefined && { description: row.description }),
    ...(row.notes !== undefined && { notes: row.notes }),
    ...(row.relatedTagNumber !== undefined && { related_tag_number: row.relatedTagNumber }),
  };
}

function fromPdfExport(row: DbRow): PdfExportRecord {
  return {
    id: text(row.id),
    tagNumber: text(row.tag_number),
    generatedAt: text(row.generated_at),
    ownerName: text(row.owner_name),
    notes: text(row.notes),
    sampleCopy: row.sample_copy === true,
  };
}

// ─── CATTLE ────────────────────────────────────────────────────────────────

export async function getAllCattle(): Promise<Cattle[]> {
  const { supabase, farm } = await getFarmContext();
  const { data, error } = await supabase.from("cattle").select("*").eq("farm_id", farm.id).order("tag_number");
  if (error) throw new Error(`Could not load cattle records: ${error.message}`);
  return (data ?? []).map((row) => fromCattle(row));
}

export async function getActiveCattle(): Promise<Cattle[]> {
  return (await getAllCattle()).filter((cattle) => cattle.status === "active");
}

export async function getCattleByTag(tagNumber: string): Promise<Cattle | undefined> {
  const { supabase, farm } = await getFarmContext();
  const { data, error } = await supabase.from("cattle").select("*")
    .eq("farm_id", farm.id).eq("tag_number", tagNumber).maybeSingle();
  if (error) throw new Error(`Could not load cattle record: ${error.message}`);
  return data ? fromCattle(data) : undefined;
}

export async function createCattle(data: Omit<Cattle, "createdAt" | "updatedAt">): Promise<Cattle> {
  const { supabase, farm } = await getFarmContext();
  const { data: row, error } = await supabase.from("cattle")
    .insert({ ...toCattle(data), farm_id: farm.id }).select("*").single();
  if (error) throw new Error(`Could not create cattle record: ${error.message}`);
  return fromCattle(row);
}

export async function updateCattle(tagNumber: string, data: Partial<Cattle>): Promise<Cattle | null> {
  const { supabase, farm } = await getFarmContext();
  const { data: row, error } = await supabase.from("cattle").update(toCattle(data))
    .eq("farm_id", farm.id).eq("tag_number", tagNumber).select("*").maybeSingle();
  if (error) throw new Error(`Could not update cattle record: ${error.message}`);
  return row ? fromCattle(row) : null;
}

export async function softDeleteCattle(tagNumber: string): Promise<boolean> {
  return (await updateCattle(tagNumber, { status: "archived" })) !== null;
}

// ─── BREEDING ──────────────────────────────────────────────────────────────

export async function getAllBreeding(): Promise<BreedingRecord[]> {
  const { supabase, farm } = await getFarmContext();
  const { data, error } = await supabase.from("breeding").select("*")
    .eq("farm_id", farm.id).order("breed_date", { ascending: false });
  if (error) throw new Error(`Could not load breeding records: ${error.message}`);
  return (data ?? []).map((row) => fromBreeding(row));
}

export async function getBreedingById(id: string): Promise<BreedingRecord | undefined> {
  return (await getAllBreeding()).find((record) => record.id === id);
}

export async function getBreedingByCow(cowTagNumber: string): Promise<BreedingRecord[]> {
  return (await getAllBreeding()).filter((record) => record.cowTagNumber === cowTagNumber);
}

export async function createBreeding(
  data: Omit<BreedingRecord, "id" | "possibleCalvingDate" | "createdAt" | "updatedAt">,
): Promise<BreedingRecord> {
  const { supabase, farm } = await getFarmContext();
  const payload = {
    ...toBreeding({
      ...data,
      id: uuidv4(),
      possibleCalvingDate: data.actualCalvingDate || calcCalvingDate(data.breedDate),
      breedDate: data.actualCalvingDate ? calcBreedDate(data.actualCalvingDate) : data.breedDate,
    }),
    farm_id: farm.id,
  };
  const { data: row, error } = await supabase.from("breeding").insert(payload).select("*").single();
  if (error) throw new Error(`Could not create breeding record: ${error.message}`);
  return fromBreeding(row);
}

export async function updateBreeding(id: string, data: Partial<BreedingRecord>): Promise<BreedingRecord | null> {
  const existing = await getBreedingById(id);
  if (!existing) return null;
  const updated = { ...existing, ...data, updatedAt: nowISO() };
  if (data.breedDate && data.breedDate !== existing.breedDate) {
    updated.possibleCalvingDate = calcCalvingDate(data.breedDate);
  }
  if (data.actualCalvingDate && data.actualCalvingDate !== existing.actualCalvingDate) {
    updated.breedDate = calcBreedDate(data.actualCalvingDate);
    updated.possibleCalvingDate = data.actualCalvingDate;
  }
  const { supabase, farm } = await getFarmContext();
  const { data: row, error } = await supabase.from("breeding").update(toBreeding(updated))
    .eq("farm_id", farm.id).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(`Could not update breeding record: ${error.message}`);
  return row ? fromBreeding(row) : null;
}

export async function deleteBreeding(id: string): Promise<boolean> {
  const { supabase, farm } = await getFarmContext();
  const { data, error } = await supabase.from("breeding").delete()
    .eq("farm_id", farm.id).eq("id", id).select("id").maybeSingle();
  if (error) throw new Error(`Could not delete breeding record: ${error.message}`);
  return data !== null;
}

export async function autoCreateBreedingForCalf(calf: Cattle): Promise<void> {
  if (!calf.damTagNumber) return;
  await createBreeding({
    cowTagNumber: calf.damTagNumber,
    sireTagNumber: calf.sireTagNumber || "",
    breedDate: calcBreedDate(calf.dateOfBirth),
    actualCalvingDate: calf.dateOfBirth,
    calfTagNumber: calf.tagNumber,
    notes: `Auto-created from calf ${calf.tagNumber}`,
    status: "calved",
  });
}

// ─── HEALTH ────────────────────────────────────────────────────────────────

export async function getAllHealth(): Promise<HealthRecord[]> {
  const { supabase, farm } = await getFarmContext();
  const { data, error } = await supabase.from("health").select("*")
    .eq("farm_id", farm.id).order("record_date", { ascending: false });
  if (error) throw new Error(`Could not load health records: ${error.message}`);
  return (data ?? []).map((row) => fromHealth(row));
}

export async function getHealthById(id: string): Promise<HealthRecord | undefined> {
  return (await getAllHealth()).find((record) => record.id === id);
}

export async function createHealth(data: Omit<HealthRecord, "id" | "createdAt" | "updatedAt">): Promise<HealthRecord> {
  const { supabase, farm } = await getFarmContext();
  const { data: row, error } = await supabase.from("health")
    .insert({ ...toHealth({ ...data, id: uuidv4() }), farm_id: farm.id }).select("*").single();
  if (error) throw new Error(`Could not create health record: ${error.message}`);
  return fromHealth(row);
}

export async function updateHealth(id: string, data: Partial<HealthRecord>): Promise<HealthRecord | null> {
  const { supabase, farm } = await getFarmContext();
  const { data: row, error } = await supabase.from("health").update(toHealth(data))
    .eq("farm_id", farm.id).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(`Could not update health record: ${error.message}`);
  return row ? fromHealth(row) : null;
}

export async function deleteHealth(id: string): Promise<boolean> {
  const { supabase, farm } = await getFarmContext();
  const { data, error } = await supabase.from("health").delete()
    .eq("farm_id", farm.id).eq("id", id).select("id").maybeSingle();
  if (error) throw new Error(`Could not delete health record: ${error.message}`);
  return data !== null;
}

// ─── FINANCES ──────────────────────────────────────────────────────────────

export async function getAllFinances(): Promise<FinanceRecord[]> {
  const { supabase, farm } = await getFarmContext();
  const { data, error } = await supabase.from("finances").select("*")
    .eq("farm_id", farm.id).order("date", { ascending: false });
  if (error) throw new Error(`Could not load finance records: ${error.message}`);
  return (data ?? []).map((row) => fromFinance(row));
}

export async function getFinanceById(id: string): Promise<FinanceRecord | undefined> {
  return (await getAllFinances()).find((record) => record.id === id);
}

export async function createFinance(data: Omit<FinanceRecord, "id" | "createdAt" | "updatedAt">): Promise<FinanceRecord> {
  const { supabase, farm } = await getFarmContext();
  const { data: row, error } = await supabase.from("finances")
    .insert({ ...toFinance({ ...data, id: uuidv4() }), farm_id: farm.id }).select("*").single();
  if (error) throw new Error(`Could not create finance record: ${error.message}`);
  return fromFinance(row);
}

export async function updateFinance(id: string, data: Partial<FinanceRecord>): Promise<FinanceRecord | null> {
  const { supabase, farm } = await getFarmContext();
  const { data: row, error } = await supabase.from("finances").update(toFinance(data))
    .eq("farm_id", farm.id).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(`Could not update finance record: ${error.message}`);
  return row ? fromFinance(row) : null;
}

export async function deleteFinance(id: string): Promise<boolean> {
  const { supabase, farm } = await getFarmContext();
  const { data, error } = await supabase.from("finances").delete()
    .eq("farm_id", farm.id).eq("id", id).select("id").maybeSingle();
  if (error) throw new Error(`Could not delete finance record: ${error.message}`);
  return data !== null;
}

// ─── SETTINGS ──────────────────────────────────────────────────────────────

export async function getSettings(): Promise<FarmSettings> {
  const { supabase, farm } = await getFarmContext();
  const { data, error } = await supabase.from("farm_settings").select("*")
    .eq("farm_id", farm.id).maybeSingle();
  if (error) throw new Error(`Could not load farm settings: ${error.message}`);
  return {
    ...defaultSettings,
    farmName: farm.name,
    ownerName: text(data?.owner_name),
    address: text(data?.address),
    phone: text(data?.phone),
    email: text(data?.email),
    website: text(data?.website),
  };
}

export async function saveSettings(settings: FarmSettings): Promise<FarmSettings> {
  const { supabase, farm } = await getFarmContext();
  const { error: farmError } = await supabase.from("farms").update({ name: settings.farmName })
    .eq("id", farm.id);
  if (farmError) throw new Error(`Could not save farm name: ${farmError.message}`);
  const { error } = await supabase.from("farm_settings").upsert({
    farm_id: farm.id,
    owner_name: settings.ownerName,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
  });
  if (error) throw new Error(`Could not save farm settings: ${error.message}`);
  return settings;
}

// ─── PDF EXPORTS ─────────────────────────────────────────────────────────────

export async function getAllPdfExports(): Promise<PdfExportRecord[]> {
  const { supabase, farm } = await getFarmContext();
  const { data, error } = await supabase.from("pdf_exports").select("*")
    .eq("farm_id", farm.id).order("generated_at", { ascending: false });
  if (error) throw new Error(`Could not load PDF export records: ${error.message}`);
  return (data ?? []).map((row) => fromPdfExport(row));
}

export async function getPdfExportsByTag(tagNumber: string): Promise<PdfExportRecord[]> {
  return (await getAllPdfExports()).filter((record) => record.tagNumber === tagNumber);
}

export async function recordPdfExport(
  data: { id: string; tagNumber: string; generatedAt?: string; ownerName: string; notes?: string; sampleCopy?: boolean },
): Promise<PdfExportRecord> {
  const { supabase, farm } = await getFarmContext();
  const { data: row, error } = await supabase.from("pdf_exports").insert({
    farm_id: farm.id,
    id: data.id || uuidv4(),
    tag_number: data.tagNumber,
    generated_at: data.generatedAt || nowISO(),
    owner_name: data.ownerName.trim(),
    notes: data.notes?.trim() || "",
    sample_copy: data.sampleCopy ?? false,
  }).select("*").single();
  if (error) throw new Error(`Could not record PDF export: ${error.message}`);
  return fromPdfExport(row);
}
