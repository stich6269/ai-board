import {memo} from "react";
import {Issue} from "@models/issues";
import {Paper} from "@mui/material";
import dayjs from "dayjs";

export const Tooltip = memo((props: {
  itemData: {dataIndex: number},
  series: {data: {item: Issue}[]}
}) => {
  const item = props.series.data[props.itemData.dataIndex].item;
  
  return (
    <Paper sx={{padding: '8px 12px', lineHeight: 1.25}}>
      {item?.name} <br/>
      Created: {dayjs.unix(item?.startDate).format('DD MMM YYYY, HH:MM')} <br/>
      Type: {item?.type} <br/>
      Duration: {item?.duration} hours <br/>
    </Paper>
  )
})