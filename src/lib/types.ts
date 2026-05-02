export type SessionType = "recording" | "mix" | "live";

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
  // live extras (optional — only shown for "live" sessions)
  stand?: string;
  stageBox?: string;
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

// ===== Live-specific types =====
export interface MonitorMix {
  id: string;
  mixNumber: string; // "1", "2", "IEM A"
  performer: string; // "Drummer", "Lead vocals"
  type: "iem" | "wedge" | "sidefill";
  contents: string; // free text: "vox loud, less bass"
  notes: string;
}

export interface SetlistSong {
  id: string;
  position: number;
  title: string;
  bpm: string;
  key: string;
  duration: string; // "3:42"
  cues: string; // "Scene 04, FX Hall verse"
  notes: string;
}

export interface ShowLogEntry {
  id: string;
  timestamp: string; // ISO
  severity: "info" | "warn" | "issue";
  message: string;
}

export interface Session {
  id: string;
  type: SessionType;
  title: string;
  artist: string;
  createdAt: string;
  projectId?: string | null;
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
  // live (stored inside `notes` field as JSON sub-blocks via dedicated columns when present;
  // for portability we keep them inline on the Session object — DataProvider maps them to
  // existing jsonb columns where possible)
  venue?: string;
  paSystem?: string;
  fohConsole?: string;
  monitorConsole?: string;
  showDate?: string;
  monitorNotes?: string;
  monitorMixes?: MonitorMix[];
  setlist?: SetlistSong[];
  showLog?: ShowLogEntry[];
}

export interface Client {
  id: string;
  name: string;
  notes: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  notes: string;
  color: string;
  clientId: string | null;
  createdAt: string;
}