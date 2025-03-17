import {memo, useEffect, useMemo} from "react";

import {SelectControlled, SelectControlledProps} from "@ui/SelectControlled.tsx";
import {getProjectEngineerIds} from "../helpers/get-project-ingeneers.ts";
import {Engineer, useEngineers} from "@models/engeneers";
import {Team, useTeams} from "@models/teams";
import {Project} from "@models/projects";

type EngineerFilterProps = Omit<SelectControlledProps, 'options' | 'disabled'> & {
  team: Team | null;
  project: Project | null;
  setValue: (name: any, v: Engineer | null) => void;
}

export const EngineerFilter = memo(({team, project, setValue, ...props}: EngineerFilterProps) => {
  const {data: teams, isFetching: teamFetching} = useTeams();
  const {data, isFetching} = useEngineers();
  
  useEffect(() => {
    setValue(props.name, null)
  }, [team]);
  
  const allowedEngineers = useMemo(() => {
    if (team) return team.engineers
    else if (project) return getProjectEngineerIds(project, teams)
    return []
  }, [teams, project, team])
  
  const options = useMemo(() => {
    return (data || []).filter(it => allowedEngineers.length
      ? allowedEngineers.includes(it.id)
      : true
    )
  }, [data, allowedEngineers])
  
  return <SelectControlled
    {...props}
    disabled={isFetching || teamFetching}
    getOptionLabel={opt=> opt.name}
    options={options}
  />
})