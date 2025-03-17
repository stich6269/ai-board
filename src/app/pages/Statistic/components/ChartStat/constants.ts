import {IssueType} from "../../../../shared/models/issues/types.ts";

export const LABEL_MAP: Record<IssueType, string> = {
  [IssueType.BUG]: 'Bugfix',
  [IssueType.FEATURE]: 'Features',
  [IssueType.IMPROVEMENT]: 'Improvement',
}