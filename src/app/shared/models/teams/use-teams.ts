import {useQuery} from "@tanstack/react-query";
import {teamsApi} from "./api.ts";

export const useTeams = () =>  useQuery(teamsApi.getAll)