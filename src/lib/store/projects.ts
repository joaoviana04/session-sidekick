import { useMemo } from "react";
import { useData } from "@/lib/store/DataProvider";

export function useProjects(clientId?: string | null) {
  const {
    projects: all,
    loading,
    createProject,
    updateProject,
    removeProject,
    refetchAll,
  } = useData();
  const projects = useMemo(() => {
    if (clientId === undefined) return all;
    if (clientId === null) return all.filter((p) => !p.clientId);
    return all.filter((p) => p.clientId === clientId);
  }, [all, clientId]);
  return {
    projects,
    loading,
    create: createProject,
    update: updateProject,
    remove: removeProject,
    refetch: refetchAll,
  };
}
