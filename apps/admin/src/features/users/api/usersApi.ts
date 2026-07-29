import type { Role } from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export const usersApi = {
  list: () => apiClient.get<AdminUser[]>("/users"),
  updateRole: (id: string, role: Role) =>
    apiClient.put<AdminUser>(`/users/${id}/role`, { role }),
};
