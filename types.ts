export interface Correction {
  lineNumber: number;
  original: string;
  corrected: string;
  isError: boolean;
  explanation: string;
}

export interface CorrectionResponse {
  htmlCorrections: Correction[];
  cssCorrections: Correction[];
}
