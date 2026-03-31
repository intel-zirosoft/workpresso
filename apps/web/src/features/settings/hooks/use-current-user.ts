"use client";

import { useQuery } from "@tanstack/react-query";

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  department: string | null;
  role: string | null;
  status: string | null;
};

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch("/api/users/me", {
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  return response.json();
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: 0,
    staleTime: 60 * 1000,
  });
}
