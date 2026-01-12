import { useQuery } from "@tanstack/react-query";
import { gitApi } from "@/lib/api";

export function useFileContent(base: string, head: string, filePath: string) {
  return useQuery({
    queryKey: ["fileContent", base, head, filePath],
    queryFn: () => gitApi.getFileContent(base, head, filePath),
    enabled: !!base && !!head && !!filePath,
  });
}

export function useRawDiff(base: string, head: string, filePath?: string) {
  return useQuery({
    queryKey: ["rawDiff", base, head, filePath],
    queryFn: () => gitApi.getRawDiff(base, head, filePath),
    enabled: !!base && !!head,
  });
}
