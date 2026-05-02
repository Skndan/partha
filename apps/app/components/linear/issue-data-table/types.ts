export type IssueTableRow = {
  id: string;
  identifier: string;
  title: string;
  description: string;
  statusId: string;
  statusName: string;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  assigneeId: string | null;
  assigneeName: string | null;
  projectId: string | null;
  projectName: string | null;
  milestoneId: string | null;
  milestoneName: string | null;
  teamId: string | null;
  teamName: string | null;
  dueDate: string | null;
  estimate: number | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
};

export type IssueOption = { id: string; name: string };
export type IssueLabelOption = { id: string; name: string; color: string };
