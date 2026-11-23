/** Maximum upload size per document type (frontend mock; editable in User Settings -> Document Rules). */
export interface DocumentSizeRule {
  id: string;
  docType: string;
  /** Allowed formats shown next to the size. */
  formats: string[];
  /** Maximum size in MB. */
  maxMb: number;
}

export const DOCUMENT_SIZE_RULES: DocumentSizeRule[] = [
  { id: 'aadhaar', docType: 'Aadhaar', formats: ['PDF', 'JPG', 'PNG'], maxMb: 2 },
  { id: 'pan', docType: 'PAN', formats: ['PDF', 'JPG', 'PNG'], maxMb: 2 },
  { id: 'bank', docType: 'Bank proof', formats: ['PDF', 'JPG', 'PNG'], maxMb: 2 },
  { id: 'education', docType: 'Education certificate', formats: ['PDF'], maxMb: 5 },
  { id: 'experience', docType: 'Experience letter', formats: ['PDF'], maxMb: 5 },
  { id: 'photo', docType: 'Passport photo', formats: ['JPG', 'PNG'], maxMb: 1 },
  { id: 'signature', docType: 'Signature', formats: ['JPG', 'PNG'], maxMb: 1 },
  { id: 'bulk', docType: 'Bulk import file', formats: ['XLSX', 'CSV'], maxMb: 10 },
];
