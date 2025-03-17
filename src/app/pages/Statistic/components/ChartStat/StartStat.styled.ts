import {Box, styled} from "@mui/material";
import Typography from "@mui/material/Typography";

export const ChartStatStyled = styled(Box)`
    border: 1px solid rgba(0, 0, 0, 0.24);
    border-radius: 4px;
    display: flex;
    width: 30%;
    height: 470px;
    padding: 8px 12px;
    flex-direction: column;
    gap: 20px;
`

export const Section = styled(Box)`
    width: 100%;
`
export const SectionTitle = styled(Typography)`
`
export const SectionRow = styled(Box)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`

export const Text = styled(Typography)`
    font-size: 14px;
    color: gray;
`