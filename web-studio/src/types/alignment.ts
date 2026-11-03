export type AlignmentReviewStatus = 'pending' | 'reviewed' | 'approved';

export interface CharMatchStatus {
  char: string;
  isMatched: boolean;
  color: 'BLACK' | 'RED';
  targetQn?: string;
  readings?: string[];
  reason?: string;
}

export interface AlignmentRecord {
  // Required 4 Academic Columns:
  img_id: string;        // e.g. "Ca Trù Thê Cách, AB 160, Nôm_Y.006.jpg"
  sentence_id: string;   // e.g. "Ca Trù Thê Cách, AB 160, Nôm_Y.006.1"
  SinoNom_Char: string;  // Transcription of Sino-Nom characters
  ChuQN_txt: string;     // Modern Vietnamese translation/reading

  // System State:
  id: string;            // Unique record ID
  pageNumber: number;
  lineIndex: number;     // 0-indexed line on page
  isMatched: boolean;    // false if contains any Red character
  color: 'BLACK' | 'RED';
  charStatuses: CharMatchStatus[];
  reviewStatus: AlignmentReviewStatus;
  editorNote?: string;
  isEdited?: boolean;
}
