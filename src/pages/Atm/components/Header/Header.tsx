import {HeaderStyled} from "./Header.styled.ts";
import {Button, ButtonGroup} from "@mui/material";
import {LocalizationProvider} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {useEffect} from "react";
import {useSupervisorStore} from "../../../../data/supervisor";

export const Header = () => {
    const supervisor = useSupervisorStore();

    useEffect(() => {
        useSupervisorStore.setState(s => ({
            start: s.logs[s.logs.length - 2],
            end: s.logs[s.logs.length - 1],
        }));
    }, [supervisor.logs])

    const onNext = () => {
        const nextIdx = supervisor.end!.id + 1;

        useSupervisorStore.setState(s => ({
            start: s.end,
            end: s.logs[nextIdx],
        }));
    }

    const onPrev = () => {
        const prevIdx = supervisor.start!.id - 1;

        useSupervisorStore.setState(s => ({
            start: s.logs[prevIdx],
            end: s.start,
        }));
    }

    return (
        <HeaderStyled>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className='date'>
                    {supervisor.start?.date!.format('DD MMMM YYYY')} -
                    {supervisor.end?.date!.format('DD MMMM YYYY')}
                </div>

            </LocalizationProvider>

            <ButtonGroup variant="contained"
                         aria-label="Basic button group"
                         disableElevation>

                <Button disabled={supervisor.start?.isFirst} onClick={onPrev}>Prev</Button>
                <Button disabled={supervisor.end?.isLast} onClick={onNext}>Next</Button>
            </ButtonGroup>

            <ButtonGroup variant="contained"
                         aria-label="Basic button group"
                         disableElevation>

                {/*<Button disabled>Dashboard</Button>*/}
                <Button color="primary">Supervisor mode</Button>
            </ButtonGroup>
        </HeaderStyled>
    )
}
