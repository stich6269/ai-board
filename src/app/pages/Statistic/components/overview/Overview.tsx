import {DemoPaper, OverviewStyled, Title, Value} from "./Overview.styled.ts";
import {Stack} from "@mui/material";
import {useMemo} from "react";
import {countDuration} from "../../../../shared/helpers/countDuration.ts";
import {useQuery} from "@tanstack/react-query";
import {issueApi} from "../../../../shared/model/issues/api.ts";
import {engineerApi} from "../../../../shared/model/engeneers/api.ts";
import {aiIssuesStat} from "../../../../shared/libs/ai-issues-stat.ts";



export const Overview = () => {
  const {data} = useQuery(issueApi.getAll())
  const {data: people} = useQuery(engineerApi.getAll())
  const duration = useMemo(() => countDuration(data), [data])
  const {
    aiUsage,
    aiBoostPercentage
  } = useMemo(() => aiIssuesStat(data), [data])
  
  
  return (
    <OverviewStyled>
      <Stack direction="row" spacing={2}>
        <DemoPaper variant="elevation">
          <Title>Issues closed</Title>
          <Value>{data?.length}</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation">
          <Title>Engineers</Title>
          <Value>{people?.length}</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation">
          <Title>Working time</Title>
          <Value>{duration}h</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation">
          <Title>Ai used</Title>
          <Value>{aiUsage} h</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation">
          <Title>AI usage boost</Title>
          <Value>{aiBoostPercentage}%</Value>
        </DemoPaper>
      </Stack>
    </OverviewStyled>
  )
}