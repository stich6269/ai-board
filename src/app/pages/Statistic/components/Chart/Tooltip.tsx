import {ChartsItemContentProps} from "@mui/x-charts/ChartsTooltip/ChartsItemTooltipContent";
import {Paper} from "@mui/material";
import {memo} from "react";
import dayjs from "dayjs";
import {Issue} from "@models/issues";

export const Tooltip = memo(({itemData, series}: ChartsItemContentProps<any>) => {
  const dataIndex = itemData.dataIndex as number;
  const dataItem = series.data[dataIndex];
  const item = dataItem.item as Issue;
  
  return (
    <Paper sx={{padding: '8px 12px', lineHeight: 1.25}}>
      {item?.name} <br/>
      Created: {dayjs.unix(item?.startDate).format('DD MMM YYYY, HH:MM')} <br/>
      Type: {item?.type} <br/>
      Duration: {item?.duration} hours <br/>
    </Paper>
  )
})