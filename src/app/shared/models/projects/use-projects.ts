import {useQuery} from "@tanstack/react-query";
import {projectsApi} from "./api.ts";

export const useProjects = () =>  useQuery(projectsApi.getAll)