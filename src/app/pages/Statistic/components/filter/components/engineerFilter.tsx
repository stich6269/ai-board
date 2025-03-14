import {FilterItem, FilterItemProps} from "./filterItem.tsx";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useMemo} from "react";
import {Team} from "../../../../../shared/model/teams/types.ts";
import {engineerApi} from "../../../../../shared/model/engeneers/api.ts";
import {Project} from "../../../../../shared/model/projects/types.ts";
import {teamsApi} from "../../../../../shared/model/teams/api.ts";
import {Engineer} from "../../../../../shared/model/engeneers/types.ts";

type EngineerFilterProps = Omit<FilterItemProps, 'options' | 'isFetching'> & {
  team: Team | null;
  project: Project | null;
  setValue: (name: any, v: Engineer | null) => void;
}

export const EngineerFilter = ({team, project, setValue, ...props}: EngineerFilterProps) => {
  const {data: teams, isFetching: teamFetching} = useQuery(teamsApi.getAll());
  const {data, isFetching} = useQuery(engineerApi.getAll());
  
  useEffect(() => {
    setValue(props.name, null)
  }, [team]);
  
  const getProjectEngineers = () => {
    if(!project || !teams) return [];
    return teams
      .filter(it => project.teams.includes(it.id))
      .reduce((acc, it) => [...acc, ...it.engineers], [] as string[])
  }
  
  const allowedEngineers = useMemo(() => {
    if (team) return team.engineers
    else if (project) return getProjectEngineers()
    return []
  }, [teams, project, team])
  
  const options = useMemo(() => {
    return (data || [])
    .filter(it => allowedEngineers.length ? allowedEngineers.includes(it.id) : true)
    .map(({name, ...item}) => ({label: name, ...item}));
  }, [data, allowedEngineers])
  
  return <FilterItem
    {...props}
    isFetching={isFetching || teamFetching}
    options={options}
  />
}