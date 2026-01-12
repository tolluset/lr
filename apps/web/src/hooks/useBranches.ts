import { useQuery } from "@tanstack/react-query";
import { gitApi } from "@/lib/api";

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => gitApi.getBranches(),
  });
}
