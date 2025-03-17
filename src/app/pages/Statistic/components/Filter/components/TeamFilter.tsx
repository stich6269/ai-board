import {useEffect} from "react";

import {SelectControlled, SelectControlledProps} from "@ui/SelectControlled.tsx";
import {Team, useTeams} from "@models/teams";
import {Project} from "@models/projects";

type TeamFilterProps = Omit<SelectControlledProps, 'options' | 'disabled'> & {
  project: Project | null;
  setValue: (name: any, v: Team | null) => void;
}

export const TeamFilter = ({project, setValue, ...props}: TeamFilterProps) => {
  const {data, isFetching} = useTeams();
  
  useEffect(() => {
    if(!data?.length) return;
    // autofill if only one option in a list
    if(!project || project.teams.length !== 1) setValue(props.name, null);
    else setValue(props.name, data[0])
  }, [project]);
  
  return <SelectControlled
    {...props}
    disabled={isFetching}
    options={data}
    getOptionLabel={opt=> opt.name}
  />
}