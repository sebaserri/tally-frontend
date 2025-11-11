// src/types/coi.types.ts
export type COIStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface COI {
  id: string;
  vendorId: string;
  buildingId: string;
  vendor: {
    id: string;
    legalName: string;
    contactEmail: string;
  };
  building: {
    id: string;
    name: string;
    address: string;
  };
  producer?: string;
  insuredName?: string;
  policyNumber?: string;
  insurer?: string;
  holder?: string;
  generalLiabLimit?: number;
  autoLiabLimit?: number;
  umbrellaLimit?: number;
  workersComp?: boolean;
  additionalInsured?: boolean;
  waiverOfSubrogation?: boolean;
  certificateHolder?: string;
  effectiveDate?: string;
  expirationDate?: string;
  status: COIStatus;
  notes?: string;
  files: COIFile[];
  createdAt: string;
  updatedAt: string;
}

export interface COIFile {
  id: string;
  url: string;
  kind: string;
}

export interface COIListItem {
  id: string;
  vendorId: string;
  buildingId: string;
  vendor: { id: string; legalName: string };
  building: { id: string; name: string };
  insuredName?: string;
  effectiveDate?: string;
  expirationDate?: string;
  status: COIStatus;
  generalLiabLimit?: number;
  autoLiabLimit?: number;
  workersComp?: boolean;
  createdAt: string;
  uploadedAt?: string;
}

export interface COIReviewPayload {
  status: COIStatus;
  notes?: string;
}
