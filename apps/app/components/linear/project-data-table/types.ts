export type ProjectTableRow = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: "planned" | "active" | "completed" | "archived";
  teamId: string | null;
  teamName: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
};
