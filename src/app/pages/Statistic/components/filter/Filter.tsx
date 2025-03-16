import {FilterStyled, SelectsGroup} from "./Filter.styled.ts";
import {Button} from "@mui/material";
import {useForm} from "react-hook-form";
import {ProjectFilter} from "./components/projectFilter.tsx";
import {TeamFilter} from "./components/teamFilter.tsx";
import {EngineerFilter} from "./components/engineerFilter.tsx";
import {Project} from "../../../../shared/model/projects/types.ts";
import {Team} from "../../../../shared/model/teams/types.ts";
import {Engineer} from "../../../../shared/model/engeneers/types.ts";
import {memo, useEffect} from "react";

export interface FilterForm {
  project: Project | null;
  team:  Team | null;
  engineer:  Engineer | null;
}


export const Filter = memo(({onFilterChange}: {onFilterChange(v: FilterForm): void}) => {
  const {control, reset, watch, setValue} = useForm<FilterForm>({
    defaultValues: {project: null, team: null, engineer: null}
  });
  
  useEffect(() => {
    onFilterChange(watch())
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