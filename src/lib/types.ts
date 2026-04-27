export type SessionType = "recording" | "mix";

export interface InputChannel {
  id: string;
  ch: number;
  source: string;
  mic: string;
  preamp: string;
  phantom: boolean;
  pad: boolean;
  hpf: boolean;
  notes: string;
}

export type TakeRating = "keeper" | "alt" | "reject" | "unrated";
export interface Take {
  id: string;
  number: string;
  song: string;
  timestamp: string; // ISO
  rating: TakeRating;
  notes: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  group: string;
}

export interface ReferenceTrack {
  id: string;
  title: string;
  artist: string;
  lufs: string;
  notes: string;
}

export type RevisionStatus = "draft" | "sent" | "approved" | "revise";
export interface Revision {
  id: string;
  version: string;
  date: string; // ISO
  status: RevisionStatus;
  feedback: string;
  changes: string;
}

export interface Session {
  id: string;
  type: SessionType;
  title: string;
  artist: string;
  createdAt: string;
  // shared
  notes: string;
  bpm?: number;
  key?: string;
  sampleRate?: string;
  // recording
  inputs?: InputChannel[];
  takes?: Take[];
  // mix
  checklist?: ChecklistItem[];
  references?: ReferenceTrack[];
  revisions?: Revision[];
  lufsTarget?: string;
  truePeakTarget?: string;
}