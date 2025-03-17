import {IssueType} from "@models/issues";

export const LABEL_MAP: Record<IssueType, string> = {
  [IssueType.BUG]: 'Bugfix',
  [IssueType.FEATURE]: 'Features',
  [IssueType.IMPROVEMENT]: 'Improvement',
}