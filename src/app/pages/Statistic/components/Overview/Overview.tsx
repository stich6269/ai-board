import {memo, useMemo} from "react";
import {Stack} from "@mui/material";

import {DemoPaper, OverviewStyled, Title, Value} from "./Overview.styled.ts";
import {countDuration} from "@helpers/count-duration.ts";
import {aiIssuesStat} from "@helpers/ai-issues-stat.ts";
import {useEngineers} from "@models/engeneers";
import {useIssues} from "@models/issues";

export const Overview = memo(() => {
  const {data} = useIssues();
  const {data: engineers} = useEngineers();
  const duration = useMemo(() => countDuration(data), [data])
  const {aiUsageDuration, aiBoostPercentage} = useMemo(() => aiIssuesStat(data), [data])
  
  return (
    <OverviewStyled>
      <Stack direction="row" spacing={2}>
        <DemoPaper variant="elevation" data-testid="issues-block">
          <Title>Issues closed</Title>
          <Value>{data?.length}</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation" data-testid="engineers-block">
          <Title>Engineers</Title>
          <Value>{engineers?.length}</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation" data-testid="working-time-block">
          <Title>Working time</Title>
          <Value>{duration}h</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation" data-testid="ai-used-block">
          <Title>Ai used</Title>
          <Value>{aiUsageDuration} h</Value>
        </DemoPaper>
        
        <DemoPaper variant="elevation" data-testid="ai-boost-block">
          <Title>AI usage boost</Title>
          <Value>{aiBoostPercentage}%</Value>
        </DemoPaper>
      </Stack>
    </OverviewStyled>
  )
})