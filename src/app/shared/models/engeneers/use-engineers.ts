import {useQuery} from "@tanstack/react-query";
import {engineerApi} from "./api.ts";

export const useEngineers = () =>  useQuery(engineerApi.getAll)