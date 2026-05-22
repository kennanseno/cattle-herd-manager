export type CattleStatus = 'active' | 'sold' | 'deceased' | 'archived';
export type CattleSex = 'male' | 'female';

export interface Cattle {
  tagNumber: string;
  nickname: string;
  dateOfBirth: string; // ISO date string YYYY-MM-DD
  sireTagNumber: string;
  damTagNumber: string;
  sex: CattleSex;
  breed: string;
  birthWeight: string;
  weaningWeight: string;
  imagePath: string;
  photos?: string; // comma-separated "data/images/filename.ext" paths
  notes?: string; // ad-hoc free-text notes
  status: CattleStatus;
  createdAt: string;
  updatedAt: string;
}

export type BreedingStatus = 'pending' | 'calved' | 'failed';

export interface BreedingRecord {
  id: string;
  cowTagNumber: string;
  sireTagNumber: string;
  breedDate: string;
  breedDateTo?: string; // set when an exact breed date is unknown; breedDate becomes the "from" date
  possibleCalvingDate: string;
  actualCalvingDate: string;
  calfTagNumber: string;
  notes: string;
  status: BreedingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecord {
  id: string;
  recordDate: string;
  vaccinationType: string;
  tagNumbers: string; // comma-separated or "all"
  veterinarian: string;
  cost: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type FinanceType = 'income' | 'expense';

export interface FinanceRecord {
  id: string;
  date: string;
  type: FinanceType;
  category: string;
  amount: string;
  description: string;
  notes: string;
  relatedTagNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface FarmSettings {
  farmName: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoPath: string;
}
