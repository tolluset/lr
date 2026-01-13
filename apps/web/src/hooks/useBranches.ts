import { useQuery } from "@tanstack/react-query";
import { gitApi } from "@/lib/api";

export function useBranches(repoPath?: string) {
  return useQuery({
    queryKey: ["branches", repoPath],
    queryFn: () => gitApi.getBranches(repoPath),
    enabled: !!repoPath,
  });
}
