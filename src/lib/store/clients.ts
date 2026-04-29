import { useData } from "@/lib/store/DataProvider";

export function useClients() {
  const {
    clients,
    loading,
    createClient,
    updateClient,
    removeClient,
    refetchAll,
  } = useData();
  return {
    clients,
    loading,
    create: createClient,
    update: updateClient,
    remove: removeClient,
    refetch: refetchAll,
  };
}
