import {Project} from "@models/projects";
import {Team} from "@models/teams";

export const getProjectEngineerIds = (project?: Project, teams?: Team[]) => {
  if(!project || !teams) return [];
  
  return teams
    .filter(it => project.teams.includes(it.id))
    .reduce((acc, it) => [...acc, ...it.engineers], [] as string[])
}
