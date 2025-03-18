import {memo, useMemo} from "react";
import {Stack} from "@mui/material";

import {DemoPaper, Loading, OverviewStyled, Title, Value} from "./Overview.styled.ts";
import {countDuration} from "@helpers/count-duration.ts";
import {aiIssuesStat} from "@helpers/ai-issues-stat.ts";
import {useEngineers} from "@models/engeneers";
import {useIssues} from "@models/issues";

export const Overview = memo(() => {
  const {data, isLoading} = useIssues();
  const {data: engineers, isFetching: isTeamLoading} = useEngineers();
  const duration = useMemo(() => countDuration(data), [data])
  const {aiUsageDuration, aiBoostPercentage} = useMemo(() => aiIssuesStat(data), [data])
  
  return (
    <OverviewStyled>
      <Stack direction="row" spacing={2}>
        <DemoPaper variant="elevation" data-testid="issues-block">
          {isLoading &&   <Loading />}
          <Title>Issues closed</Title>
          <Value>{data?.length || 0}</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation" data-testid="engineers-block">
          {isTeamLoading &&   <Loading />}
          <Title>Engineers</Title>
          <Value>{engineers?.length || 0}</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation" data-testid="working-time-block">
          {isLoading &&   <Loading />}
          <Title>Working time</Title>
          <Value>{duration || 0}h</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation" data-testid="ai-used-block">
          {isLoading &&   <Loading />}
          <Title>Ai used</Title>
          <Value>{aiUsageDuration || 0} h</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation" data-testid="ai-boost-block">
          {isLoading &&   <Loading />}
          <Title>AI usage boost</Title>
          <Value>{aiBoostPercentage || 0}%</Value>
        </DemoPaper>
      </Stack>
    </OverviewStyled>
  )
})