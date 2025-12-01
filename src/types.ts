// Medicine data types
export interface MedicineItem {
  id: string;
  name: string;
  logo: string;
  image: string;
  buyLink: string;
  buyLinkText: string;
}

export interface MedicineData {
  items: MedicineItem[];
  total_count: number;
  medicineName?: string;
  [key: string]: unknown;
}