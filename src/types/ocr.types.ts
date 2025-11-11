// src/types/ocr.types.ts

/**
 * Resultado de la extracción OCR según documentación del backend
 * POST /extract/coi/:id devuelve: ExtractResult con fields, confidence, raw
 */

export interface ExtractedField {
  value: string | number | boolean | null;
  confidence: number;
  evidence?: {
    text: string;
    line?: number;
    section?: string;
  };
}

export interface OcrExtractionResult {
  // Campos principales
  insuredName?: ExtractedField;
  producer?: ExtractedField;
  certificateHolder?: ExtractedField;

  // Fechas
  effectiveDate?: ExtractedField;
  expirationDate?: ExtractedField;

  // Límites de cobertura
  generalLiabLimit?: ExtractedField;
  autoLiabLimit?: ExtractedField;
  umbrellaLimit?: ExtractedField;

  // Flags booleanos
  workersComp?: ExtractedField;
  additionalInsured?: ExtractedField;
  waiverOfSubrogation?: ExtractedField;

  // Metadatos de la extracción
  confidence: number; // Score general de confianza (0-1)
  raw?: {
    textractResponse?: any;
    parsedSections?: {
      general?: any;
      auto?: any;
      umbrella?: any;
    };
  };
}

/**
 * Payload para aplicar campos extraídos
 * PATCH /extract/coi/:id/apply
 */
export interface ApplyOcrPayload {
  insuredName?: string;
  producer?: string;
  certificateHolder?: string;
  effectiveDate?: string;
  expirationDate?: string;
  generalLiabLimit?: number;
  autoLiabLimit?: number;
  umbrellaLimit?: number;
  workersComp?: boolean;
  additionalInsured?: boolean;
  waiverOfSubrogation?: boolean;
}
