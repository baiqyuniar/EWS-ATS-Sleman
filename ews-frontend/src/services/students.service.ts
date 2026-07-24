import { api } from "../lib/api";
import type {
  Paginated,
  Student,
  CreateStudentPayload,
  UpdateStudentPayload,
} from "../types/api";

export interface StudentQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  excludeStatus?: string;
}

export const getStudents = async (query: StudentQuery = {}): Promise<Paginated<Student>> => {
  const { data } = await api.get<Paginated<Student>>("/students", { params: query });
  return data;
};

export const getStudent = async (id: number): Promise<Student> => {
  const { data } = await api.get<Student>(`/students/${id}`);
  return data;
};

export const createStudent = async (payload: CreateStudentPayload): Promise<Student> => {
  const { data } = await api.post<Student>("/students", payload);
  return data;
};

export const updateStudent = async (
  id: number,
  payload: UpdateStudentPayload,
): Promise<Student> => {
  const { data } = await api.put<Student>(`/students/${id}`, payload);
  return data;
};

export const deleteStudent = async (id: number) => {
  const { data } = await api.delete(`/students/${id}`);
  return data;
};
