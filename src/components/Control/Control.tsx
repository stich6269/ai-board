import {ControlStyled} from "./Control.styled.ts";
import {Button, ButtonGroup} from "@mui/material";
import {LocalizationProvider} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {useAppStore} from "../../data/clients";
import {useEffect} from "react";
import dayjs from "dayjs";

export const Control = () => {
    const selectedDate = useAppStore(s => s.selectedDate);
    const selectedWeek = useAppStore(s => s.selectedWeek);
    const transactions = useAppStore(s => s.transactions);

    useEffect(() => {
        const lastDataDay = transactions![transactions.length - 1].date;
        useAppStore.setState(() => ({selectedDate: lastDataDay}));
    }, [])

    const onNext = () => {
        useAppStore.setState(() => ({
            selectedDate: selectedDate ? selectedDate!.clone().add(1, 'day') : undefined,
            selectedWeek: selectedWeek ? selectedWeek  + 1 : undefined
        }));
    }

    const onPrev = () => {
        useAppStore.setState(() => ({
            selectedDate: selectedDate ? selectedDate!.clone().subtract(1, 'day') : undefined,
            selectedWeek: selectedWeek ? selectedWeek - 1 : undefined
        }));
    }
    const onWeekly = () => {
        useAppStore.setState(() => (
            {selectedDate: undefined, selectedWeek: selectedDate?.week()}
        ));
    }

    const onDaily = () => {
        const lastDataDay = transactions![transactions.length - 1].date;
        useAppStore.setState(() => (
            {selectedDate: lastDataDay, selectedWeek: undefined}
        ));
    }

    return (
        <ControlStyled>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className='date'>
                    {selectedDate && selectedDate.format('DD MMMM YYYY')}

                    {selectedWeek && (<>
                        {dayjs().week(selectedWeek).weekday(1).format('DD MMMM YYYY')} -
                        {dayjs().week(selectedWeek).weekday(7).format('DD MMMM YYYY')}
                    </>)}
                </div>

            </LocalizationProvider>

            <ButtonGroup variant="contained"
                         aria-label="Basic button group"
                         disableElevation>

                <Button onClick={onPrev}>Prev</Button>
                <Button onClick={onNext}>Next</Button>
            </ButtonGroup>

            <ButtonGroup variant="contained"
                         aria-label="Basic button group"
                         disableElevation>

                <Button disabled>Monthly</Button>
                <Button onClick={onWeekly} color={selectedWeek ? "warning" : "primary"} >Weekly</Button>
                <Button onClick={onDaily} color={selectedDate ? "warning" : "primary"} >Daily</Button>
            </ButtonGroup>
        </ControlStyled>
    )
}
