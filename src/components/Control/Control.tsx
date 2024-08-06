import {ControlStyled} from "./Control.styled.ts";
import {Button, ButtonGroup} from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {useAppStore} from "../../data";
import {useEffect, useState} from "react";
import {Dayjs} from "dayjs";

export const Control = () => {
    const transactions = useAppStore(s => s.transactions);
    const selectedDate = useAppStore(s => s.selectedDate);
    const [min, setMin] = useState<Dayjs>();
    const [max, setMax] = useState<Dayjs>();

    useEffect(() => {
        setMax(transactions![transactions.length - 1].date);
        setMin(transactions![0].date)

        useAppStore.setState(() => ({selectedDate: transactions![transactions.length - 1].date}));
    }, [transactions])

    const onNext = () => {
        useAppStore.setState(() => ({
            selectedDate: selectedDate.clone().add(1, 'day')
        }));
    }

    const onPrev = () => {
        useAppStore.setState(() => ({
            selectedDate: selectedDate.clone().subtract(1, 'day')
        }));
    }

    const onSelect = (date: Dayjs) => {
        useAppStore.setState(() => ({
            selectedDate: date
        }));
    }

    return (
        <ControlStyled>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                    onChange={v => v && onSelect(v)}
                    minDate={min}
                    maxDate={max}
                    slotProps={{ textField: { size: 'small' } }}
                    label="Date"
                    value={selectedDate} />
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

                <Button disabled>Weekly</Button>
                <Button disabled>Monthly</Button>
                <Button>Daily</Button>
            </ButtonGroup>
        </ControlStyled>
    )
}
