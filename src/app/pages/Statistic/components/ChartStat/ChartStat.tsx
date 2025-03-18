import {Issue, IssueType} from "@models/issues";
import {memo, useMemo} from "react";

import {ChartStatStyled, NoItemsFound, Section, SectionRow, SectionTitle, Text} from "./StartStat.styled.ts";
import {typeIssueStat} from "@helpers/type-issue-stat.ts";
import {aiIssuesStat} from "@helpers/ai-issues-stat.ts";
import {LABEL_MAP} from "./constants.ts";
import Typography from "@mui/material/Typography";

interface ChartStatProps {
  issues?: Issue[];
  isFetching: boolean;
}

export const ChartStat = memo(({issues, isFetching}: ChartStatProps) => {
  const typeIssuesStatistic = useMemo(() => typeIssueStat(issues), [issues]);
  const aiStatistic = useMemo(()=> aiIssuesStat(issues), [issues])
  
  if(isFetching) {
    return (
      <ChartStatStyled>
        <NoItemsFound>
          <Typography>Loading...</Typography>
        </NoItemsFound>
      </ChartStatStyled>
    )
  }
  
  if(!issues?.length){
    return (
      <ChartStatStyled>
        <NoItemsFound>
          <Typography>No filter results</Typography>
        </NoItemsFound>
      </ChartStatStyled>
    )
  }
  
  return (
    <ChartStatStyled>
        <Section>
          <SectionTitle>Issues overview</SectionTitle>
          
          {Object.entries(typeIssuesStatistic)
          .map(([issueType, typeStat], i) => (
            <SectionRow key={i}>
              <Text>{LABEL_MAP[issueType as IssueType]}</Text>
              <Text>{typeStat.percentage}% ({typeStat.items} issues)</Text>
            </SectionRow>
          ))
          }
        </Section>
        
        <Section>
          <SectionTitle>AI statistic</SectionTitle>
          <SectionRow>
            <Text>AI performance boos</Text>
            <Text>{aiStatistic.aiBoostPercentage || '-'}%</Text>
          </SectionRow>
          <SectionRow>
            <Text>AI usage percentage</Text>
            <Text>{aiStatistic.aiUsagePercentage}%</Text>
          </SectionRow>
          <SectionRow>
            <Text>Cycle time with assistance</Text>
            <Text>{aiStatistic.aiCycleTime} hours</Text>
          </SectionRow>
          <SectionRow>
            <Text>Cycle time with no assistant</Text>
            <Text>{aiStatistic.nonAiCycleTime} hours</Text>
          </SectionRow>
          <SectionRow>
            <Text>Average cycle time</Text>
            <Text>{aiStatistic.avgCycleTime} horus</Text>
          </SectionRow>
        </Section>
      )
      
    </ChartStatStyled>
  )
})