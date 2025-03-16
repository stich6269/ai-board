import {issueApi} from "../../../../shared/model/issues/api.ts";
import {useQuery} from "@tanstack/react-query";
import {useMemo} from "react";
import {Issue} from "../../../../shared/model/issues/types.ts";
import {projectsApi} from "../../../../shared/model/projects/api.ts";
import {teamsApi} from "../../../../shared/model/teams/api.ts";
import {engineerApi} from "../../../../shared/model/engeneers/api.ts";

export const useIssuesStat = () => {
  const {data} = useQuery(issueApi.getAll())
  const {data: projects} = useQuery(projectsApi.getAll())
  const {data: teams} = useQuery(teamsApi.getAll())
  const {data: people} = useQuery(engineerApi.getAll())
  
  const duration = useMemo(() => countDuration(data), [data])
  
  return {
    generalStat: (
      <>
        Total issues {data?.length}<br/>
        Total durations {duration}<br/>
        Projects {projects?.length}<br/>
        Commands {teams?.length}<br/>
        Engineers {people?.length}
      </>
    )
  }
}

const countDuration = (issues: Issue[] | undefined) => {
  return issues ? issues.reduce((acc, it) => acc + it.duration, 0) : 0;
}