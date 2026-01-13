import { useQuery } from "@tanstack/react-query";
import { gitApi } from "@/lib/api";

export function useFileContent(base: string, head: string, filePath: string, repoPath?: string) {
  return useQuery({
    queryKey: ["fileContent", base, head, filePath, repoPath],
    queryFn: () => gitApi.getFileContent(base, head, filePath, repoPath),
    enabled: !!base && !!head && !!filePath,
  });
}

export function useRawDiff(base: string, head: string, filePath?: string, repoPath?: string) {
  return useQuery({
    queryKey: ["rawDiff", base, head, filePath, repoPath],
    queryFn: () => gitApi.getRawDiff(base, head, filePath, repoPath),
    enabled: !!base && !!head,
  });
}
