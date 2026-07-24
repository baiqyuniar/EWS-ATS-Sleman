import { api } from "../lib/api";
import type { Paginated, AppUser, CreateUserPayload, UpdateUserPayload } from "../types/api";

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export const getUsers = async (query: UserQuery = {}): Promise<Paginated<AppUser>> => {
  const { data } = await api.get<Paginated<AppUser>>("/users", { params: query });
  return data;
};

export const getUserById = async (id: number): Promise<AppUser> => {
  const { data } = await api.get<AppUser>(`/users/${id}`);
  return data;
};

export const createUser = async (payload: CreateUserPayload): Promise<AppUser> => {
  const { data } = await api.post<AppUser>("/users", payload);
  return data;
};

export const updateUser = async (id: number, payload: UpdateUserPayload): Promise<AppUser> => {
  const { data } = await api.put<AppUser>(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id: number) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};
