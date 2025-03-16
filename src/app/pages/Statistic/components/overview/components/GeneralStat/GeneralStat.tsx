import {issueApi} from "../../../../../../shared/model/issues/api.ts";
import {useQuery} from "@tanstack/react-query";
import {useMemo} from "react";
import {projectsApi} from "../../../../../../shared/model/projects/api.ts";
import {teamsApi} from "../../../../../../shared/model/teams/api.ts";
import {engineerApi} from "../../../../../../shared/model/engeneers/api.ts";
import {countDuration} from "../../../../../../shared/helpers/countDuration.ts";

export const GeneralStat = () => {
  const {data} = useQuery(issueApi.getAll())
  const {data: projects} = useQuery(projectsApi.getAll())
  const {data: teams} = useQuery(teamsApi.getAll())
  const {data: people} = useQuery(engineerApi.getAll())
  
  const duration = useMemo(() => countDuration(data), [data])
  
  return (
      <>
        Total issues {data?.length}<br/>
        Total durations {duration}<br/>
        Projects {projects?.length}<br/>
        Commands {teams?.length}<br/>
        Engineers {people?.length}
      </>
    )
}

