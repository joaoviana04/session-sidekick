import { useMemo } from "react";
import { useData } from "@/lib/store/DataProvider";
import type { InputChannel, Take, ReferenceTrack, Revision } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 10);

export function useSessions(projectId?: string | null) {
  const {
    sessions: all,
    loading,
    createSession,
    updateSession,
    removeSession,
    refetchAll,
  } = useData();
  const sessions = useMemo(() => {
    if (projectId === undefined) return all;
    if (projectId === null) return all.filter((s) => !s.projectId);
    return all.filter((s) => s.projectId === projectId);
  }, [all, projectId]);
  return {
    sessions,
    loading,
    create: createSession,
    update: updateSession,
    remove: removeSession,
    refetch: refetchAll,
  };
}

export function useSession(id: string | undefined) {
  const { sessions, updateSession, removeSession } = useData();
  const session = sessions.find((s) => s.id === id);
  return { session, update: updateSession, remove: removeSession };
}

export const helpers = {
  uid,
  newInput: (ch: number): InputChannel => ({
    id: uid(), ch, source: "", mic: "", preamp: "", phantom: false, pad: false, hpf: false, notes: "",
  }),
  newTake: (song: string, number: string): Take => ({
    id: uid(), song, number, timestamp: new Date().toISOString(), rating: "unrated", notes: "",
  }),
  newReference: (): ReferenceTrack => ({
    id: uid(), title: "", artist: "", lufs: "", notes: "",
  }),
  newRevision: (version: string): Revision => ({
    id: uid(), version, date: new Date().toISOString(), status: "draft", feedback: "", changes: "",
  }),
};
