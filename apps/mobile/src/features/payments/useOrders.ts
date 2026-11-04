import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/providers/AuthProvider";

import { paymentsApi } from "./paymentsApi";

/** The customer's orders — signed out, none. Shared by every "do I own this?". */
export function useOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["orders", user?.id],
    queryFn: paymentsApi.listMine,
    enabled: !!user,
  });
}

/** Whether a paid order covers this library item. */
export function useOwnsLibraryItem(itemId: string) {
  const orders = useOrders();
  return {
    owned: (orders.data ?? []).some(
      (o) => o.status === "PAID" && o.contentLibraryItem?.id === itemId,
    ),
    refresh: () => void orders.refetch(),
  };
}
