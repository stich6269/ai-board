import {Box, LinearProgress, Paper, styled} from "@mui/material";
import Typography from "@mui/material/Typography";

export const OverviewStyled = styled(Box)`
`

export const DemoPaper = styled(Paper)`
    width: 100%;
    overflow: hidden;
    padding: 8px 16px;
    position: relative;
`

export const Title = styled(Typography)`
    color: gray;
    margin-bottom: 10px;
`

export const Value = styled(Typography)`
    font-size: 40px;
    color: #626262;
    line-height: 1;
`

export const Loading = styled(LinearProgress)`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
`