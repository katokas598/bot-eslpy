export type Role = "Owner" | "Admin" | "Moderator" | "Viewer";

export interface TicketPayload {
  projectId: string;
  title: string;
  priority: "low" | "normal" | "high";
  assigneeTag?: string;
}
