import {Box, styled} from "@mui/material";

export const ChartStyled = styled(Box)`
    width: 100%;
    position: relative;
`

export const ChartOverlay = styled(Box)`
    display: flex;
    background-color: rgba(255, 255, 255, 0.55);
    color: gray;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
`