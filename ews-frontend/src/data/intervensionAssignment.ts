export interface InterventionAssignment {
  id: number;

  interventionId: number;

  opdName: string;

  status: "belum" | "proses" | "selesai";

  assignedAt: string;
}
