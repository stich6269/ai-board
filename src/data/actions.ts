import {Transaction, TransactionTypes, useAppStore} from "./store.ts";
import {Dayjs} from "dayjs";
import {isNumber} from "@mui/x-data-grid/internals";

export interface DailySummary{
    transactions: number;
    amount: number;
    withdrawn: number;
    deposit: number;
    change?: DailySummary
}

export const getDailyList = () => {
    const date = useAppStore.getState().selectedDate;
    return useAppStore.getState()
        .transactions?.filter(it => {
            return it.date.isSame(date, 'day')
        }) || [];
}

export const getDailySummary = (): DailySummary => {
    const day =getDaily(useAppStore.getState().selectedDate!);
    const dayBefore = getDaily(useAppStore.getState().selectedDate!.clone().subtract(1, "day"));

    return {
        ...day,
        change: {
            transactions: day.transactions - dayBefore.transactions,
            amount: day.amount - dayBefore.amount,
            deposit: day.deposit - dayBefore.deposit,
            withdrawn: day.withdrawn - dayBefore.withdrawn,
        }
    }
}

export const getDailyTransactions = () => {
    const date = useAppStore.getState().selectedDate;
    const list = useAppStore.getState()
        .transactions?.filter(it => it.date.isSame(date, 'day')) || [];

    return list.reduce((acc, it) => {
        if(acc[it.type]) {
            acc[it.type] = [...acc[it.type], it]
            return acc
        } else {
            return {...acc, [it.type]: [it]}
        }
    }, {} as Record<TransactionTypes, Transaction[]>)
}

const getDaily = (date: Dayjs): DailySummary => {
    const list = useAppStore.getState()
        .transactions?.filter(it => it.date.isSame(date, 'day')) || [];

    return {
        transactions: list.length,
        amount: list.reduce((acc, it) => acc += it.amount ? +it.amount : 0, 0),
        withdrawn: list.filter(it => it.type === TransactionTypes.WITHDRAWN)
            .reduce((acc, it) => acc += it.amount, 0),
        deposit: list.filter(it => it.type === TransactionTypes.DEPOSIT)
            .reduce((acc, it) => acc += it.amount, 0)
    }
}










export const getRangeSummary = (): DailySummary => {
    const date = useAppStore.getState().selectedDate
        ? useAppStore.getState().selectedDate
        : useAppStore.getState().selectedWeek;
    const dateBefore = useAppStore.getState().selectedDate
        ? (date as Dayjs).clone().subtract(1, 'day')
        : (date as number) - 1
    const stat = getRangeStat(date!);
    const rangeBefore = getRangeStat(dateBefore);

    return {
        ...stat,
        change: {
            transactions: stat.transactions - rangeBefore.transactions,
            amount: stat.amount - rangeBefore.amount,
            deposit: stat.deposit - rangeBefore.deposit,
            withdrawn: stat.withdrawn - rangeBefore.withdrawn,
        }
    }
}

const getRangeStat = (date: Dayjs | number): DailySummary => {
    const list = useAppStore.getState()
        .transactions?.filter(it => {
            return isNumber(date)
                ? it.date.week() === date
                : it.date.isSame(date,"day")
        }) || [];

    return {
        transactions: list.length,
        amount: list.reduce((acc, it) => acc += it.amount ? +it.amount : 0, 0),
        withdrawn: list.filter(it => it.type === TransactionTypes.WITHDRAWN)
            .reduce((acc, it) => acc += it.amount, 0),
        deposit: list.filter(it => it.type === TransactionTypes.DEPOSIT)
            .reduce((acc, it) => acc += it.amount, 0)
    }
}


export const getRangeTransactionsByType = () => {
    const list = getRangeList()

    return list.reduce((acc, it) => {
        if(acc[it.type]) {
            acc[it.type] = [...acc[it.type], it]
            return acc
        } else {
            return {...acc, [it.type]: [it]}
        }
    }, {} as Record<TransactionTypes, Transaction[]>)
}
export const getRangeList = () => {
    const date = useAppStore.getState().selectedDate;
    const week = useAppStore.getState().selectedWeek;
    return useAppStore.getState()
        .transactions?.filter(it => {
            return week
                ? it.date.week() === week
                : it.date.isSame(date,"day")
        }) || [];
}
