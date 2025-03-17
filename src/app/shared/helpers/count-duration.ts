import {Issue} from "@models/issues";

export const countDuration = (issues: Issue[] | undefined) => {
  return issues ? issues.reduce((acc, it) => acc + it.duration, 0) : 0;
}