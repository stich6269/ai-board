import {DemoPaper, OverviewStyled, Title} from "./Overview.styled.ts";
import {Stack} from "@mui/material";
import {useIssuesStat} from "./use-issues-stat.tsx";
import {useAiStat} from "./use-ai-stat.tsx";
import {useCompanyStat} from "./use-company-stat.tsx";
import {usePromptStat} from "./use-prompt-stat.tsx";



export const Overview = () => {
  const {generalStat} = useIssuesStat();
  const {cycleStat} = useAiStat();
  const {companyStat} = useCompanyStat();
  const as = usePromptStat();
  
  return (
    <OverviewStyled>
      <Stack direction="row" spacing={2}>
        <DemoPaper variant="elevation">
          <Title>Issue resolved</Title>
          {generalStat}
        </DemoPaper>
        <DemoPaper variant="elevation">
          <Title>Ai performance boost</Title>
          {cycleStat}
        </DemoPaper>
        <DemoPaper variant="elevation">
          <Title>Company focus</Title>
          {companyStat}
        </DemoPaper>
        <DemoPaper variant="elevation">
          <Title>Prompt guru</Title>
        </DemoPaper>
      </Stack>
    </OverviewStyled>
  )
}