import type { ChecklistItem } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 10);

const build = (groups: Record<string, string[]>): ChecklistItem[] =>
  Object.entries(groups).flatMap(([group, items]) =>
    items.map((label) => ({ id: uid(), label, done: false, group })),
  );

export interface ChecklistPreset {
  id: string;
  label: string;
  description: string;
  build: () => ChecklistItem[];
}

export const mixPresets: ChecklistPreset[] = [
  {
    id: "mix-full",
    label: "Full mix",
    description: "Pre-flight → Balance → Bus → Delivery",
    build: () =>
      build({
        "Pre-flight": [
          "Sample rate / bit depth confirmed",
          "Session backed up",
          "Color-coded & labeled tracks",
          "Reference tracks imported & gain-matched",
        ],
        Balance: [
          "Static mix (faders only)",
          "Phase / polarity check on multi-mic sources",
          "Mono compatibility check",
          "Low-end check on subs / headphones / car",
        ],
        "Bus & Master": [
          "Mix bus chain dialed",
          "True peak below target",
          "LUFS hits target",
          "Headroom for mastering (-6 dBFS)",
        ],
        Delivery: [
          "Print stems",
          "Print instrumental + TV mix",
          "Export 24-bit WAV @ session SR",
          "Notes & revision archived",
        ],
      }),
  },
  {
    id: "mix-quick",
    label: "Quick mix",
    description: "Fast turnaround / single revision",
    build: () =>
      build({
        Setup: ["Import & label", "Reference imported", "Rough balance"],
        Mix: ["EQ & comp pass", "FX (verb + delay) sends", "Automation pass"],
        Delivery: ["Loudness check", "Bounce stereo", "Export & deliver"],
      }),
  },
  {
    id: "mastering",
    label: "Mastering prep",
    description: "Pre-master quality control",
    build: () =>
      build({
        Inspect: [
          "Stereo image check",
          "Phase correlation",
          "Spectrum balance vs reference",
          "DC offset removal",
        ],
        Process: ["EQ tilt", "Multiband / glue comp", "Limiter / clipper", "Dither @ target bit depth"],
        Deliverables: ["DDP / WAV per platform", "ISRC / metadata embedded", "Reference loudness PDF"],
      }),
  },
];

export const livePresets: ChecklistPreset[] = [
  {
    id: "live-standard",
    label: "Standard show",
    description: "Pre-show → Line check → Soundcheck → Doors",
    build: () =>
      build({
        "Pre-show": [
          "Power & ground confirmed",
          "Stage box / snake patched",
          "Console scenes loaded",
          "RF scan & frequencies coordinated",
          "Spare batteries charged",
        ],
        "Line check": [
          "Every input verified at console",
          "Phantom power on condensers / DI",
          "Polarity / phase on multi-mic sources",
          "Talkback to stage working",
        ],
        Soundcheck: [
          "Drums & bass groove",
          "All instruments individual check",
          "Vocals & harmonies",
          "Monitor mixes confirmed by each performer",
          "FOH ringing / system tuning",
          "Full song run-through",
        ],
        Doors: [
          "Show file saved",
          "Recording armed (multitrack / 2-track)",
          "Walkie / comms with crew",
          "House music ready",
        ],
      }),
  },
  {
    id: "live-festival",
    label: "Festival / changeover",
    description: "Tight turnaround between bands",
    build: () =>
      build({
        "Pre-arrival": ["Stage plot sent", "Input list confirmed with FOH", "Patch sheet printed"],
        Changeover: [
          "Risers & backline placed",
          "Patch verified at stage box",
          "Line check (drums first)",
          "Quick monitor pass",
          "FOH gain stage",
        ],
        Show: ["Recording armed", "Show file saved", "Spare mics ready"],
      }),
  },
  {
    id: "live-club",
    label: "Club / small venue",
    description: "Compact PA, single engineer",
    build: () =>
      build({
        Setup: ["PA powered & checked", "Console / rack online", "Patch & cable test"],
        Soundcheck: ["Line check", "Monitors (wedges)", "FOH tune & ring out", "Quick song run"],
        Show: ["Record stereo board mix", "Door / house music ready"],
      }),
  },
  {
    id: "live-theater",
    label: "Theater / musical",
    description: "Cue-driven show",
    build: () =>
      build({
        "Pre-show": ["Mic check on actors", "RF scan", "Cue list loaded", "Comms check (SM)"],
        "During show": ["Follow cues", "Monitor RF battery levels", "Watch for dropouts"],
        "Post show": ["Battery recovery", "Mic sanitize", "Notes for next show"],
      }),
  },
];
