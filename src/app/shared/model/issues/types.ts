
export interface Issue {
  name: string;
  type: IssueType;
  id: string;
  aiAssistant: string;
  aiUsage: number;
  team: string;
  engineer: string;
  project: string;
  startDate: number;
  endDate: number;
  duration: number;
}

export enum IssueType {
  FEATURE = "FEATURE",
  BUG = "BUG",
  IMPROVEMENT = "IMPROVEMENT"
}