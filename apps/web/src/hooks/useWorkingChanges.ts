import { useQuery } from "@tanstack/react-query";
import { gitApi } from "@/lib/api";

export function useWorkingChanges() {
  return useQuery({
    queryKey: ["workingChanges"],
    queryFn: () => gitApi.getWorkingChanges(),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
}

export function useWorkingDiff(type: "staged" | "unstaged", filePath?: string) {
  return useQuery({
    queryKey: ["workingDiff", type, filePath],
    queryFn: () => gitApi.getWorkingDiff(type, filePath),
    enabled: !!filePath,
  });
}
