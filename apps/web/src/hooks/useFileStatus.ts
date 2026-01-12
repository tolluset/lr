import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fileApi } from "@/lib/api";
import type { UpdateFileStatusRequest } from "@local-review/shared";

export function useUpdateFileStatus(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ filePath, data }: { filePath: string; data: UpdateFileStatusRequest }) =>
      fileApi.updateStatus(sessionId, filePath, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
