import {issueApi} from "../../../../../../shared/model/issues/api.ts";
import {useQuery} from "@tanstack/react-query";
import {useMemo} from "react";
import {typeIssueStat} from "../../../../../../shared/libs/type-issue-stat.ts";
import {Box} from "@mui/material";
import Typography from "@mui/material/Typography";

export const TypeIssueStat = () => {
  const {data} = useQuery(issueApi.getAll())
  const statistic = useMemo(() => typeIssueStat(data), [data])
  
  return (
      <>
        {Object.entries(statistic).map(([key, value], i) => (
          <Box className='row' key={i}>
            <Typography className="label">{key.toLowerCase()}</Typography>
            <Typography className="value">{value.percentage}% ({value.durations}h)</Typography>
          </Box>
        ))}
      </>
    )
}