import {useForm} from "react-hook-form";
import {memo, useEffect} from "react";
import {Button} from "@mui/material";

import {EngineerFilter} from "./components/EngineerFilter.tsx";
import {FilterStyled, SelectsGroup} from "./Filter.styled.ts";
import {ProjectFilter} from "./components/ProjectFilter.tsx";
import {TeamFilter} from "./components/TeamFilter.tsx";
import {IssueFilters} from "@models/issues";
import {Engineer} from "@models/engeneers";
import {Project} from "@models/projects";
import {Team} from "@models/teams";

export interface FilterForm {
  project: Project | null;
  team:  Team | null;
  engineer:  Engineer | null;
}

export const Filter = memo(({onFilterChange}: {onFilterChange(v: IssueFilters): void}) => {
  const {control, reset, watch, setValue} = useForm<FilterForm>({
    defaultValues: {project: null, team: null, engineer: null}
  });
  
  useEffect(() => {
    onFilterChange({
      project: watch().project?.id,
      team: watch().team?.id,
      engineer: watch().engineer?.id,
    })
  }, [watch()])
  
  return (
    <FilterStyled>
      <SelectsGroup>
        <ProjectFilter
          control={control}
          name='project'
          label='Project' />
        
        <TeamFilter
          control={control}
          setValue={setValue}
          name='team'
          label='Team'
          project={watch('project')}/>
        
        <EngineerFilter
          control={control}
          setValue={setValue}
          name='engineer'
          label='Engineer'
          team={watch('team')}
          project={watch('project')}/>
      </SelectsGroup>
      
      <Button variant="outlined" size="small" onClick={() => reset({})}>Clear filters</Button>
    </FilterStyled>
  )
})