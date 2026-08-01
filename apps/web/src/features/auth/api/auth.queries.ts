import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getCurrentUser,
  login,
  logout,
} from "./auth.client";
import type { AuthUser, LoginRequest } from "./auth.contract";

export const authQueryKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authQueryKeys.all, "current-user"] as const,
};

export function currentUserQueryOptions() {
  return queryOptions({
    queryFn: ({ signal }) => getCurrentUser(signal),
    queryKey: authQueryKeys.currentUser(),
    retry: false,
  });
}

export function useCurrentUserQuery() {
  return useQuery(currentUserQueryOptions());
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser | null>(
        authQueryKeys.currentUser(),
        user,
      );
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData<AuthUser | null>(
        authQueryKeys.currentUser(),
        null,
      );
    },
  });
}
