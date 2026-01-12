import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentApi } from "@/lib/api";
import type { CreateCommentRequest, UpdateCommentRequest } from "@local-review/shared";

export function useComments(sessionId: string, filePath?: string) {
  return useQuery({
    queryKey: ["comments", sessionId, filePath],
    queryFn: async () => {
      const res = await commentApi.list(sessionId, filePath);
      return res.comments;
    },
    enabled: !!sessionId,
  });
}

export function useCreateComment(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => commentApi.create(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}

export function useUpdateComment(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentRequest }) =>
      commentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}

export function useDeleteComment(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}

export function useToggleResolve(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentApi.toggleResolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}
