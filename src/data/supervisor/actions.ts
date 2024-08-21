import {SupervisorDepositILS, SupervisorLog, useSupervisorStore} from "./store.ts";
import {Dayjs} from "dayjs";
import {Transaction, TransactionTypes, useAppStore} from "../clients";

const BANCNOTE_MAP: Record<string, number> = {
    ILS20: 20,
    ILS50: 50,
    ILS100: 100,
    ILS200: 200,
}
export interface RangeStatistic {
    amount: number;
    withdrawn: number;
    deposit: number;
    logAmount: number;
    logWithdrawn: number;
    logDeposit: number;
}
export const getRangeStatistic = ():RangeStatistic => {
    const {end, start} = useSupervisorStore.getState();

    return {
        ...logToAmounts(end!),
        ...rangeToAmounts(start?.date!, end?.date!)
    }
}

export interface ILSRangeStatistic {
    actual: {
        deposit: SupervisorDepositILS;
        withdrawn: SupervisorDepositILS;
    }
    log: {
        deposit: SupervisorDepositILS;
        withdrawn: SupervisorDepositILS;
    };
}

export const getIlsRangeStatistic = ():ILSRangeStatistic => {
    const {end, start} = useSupervisorStore.getState();

    return {
        log: logToIls(end!),
        actual: rangeToIls(start?.date!, end?.date!)
    }
}


const logToIls = (log: SupervisorLog) => {
    const deposit = log.deposit;
    const withdrawn = Object.entries(log.withdrawn)
        .reduce((acc, [key, value]) => ({...acc, [key]: value.dispensed || 0}), {} as SupervisorDepositILS);

    return {deposit, withdrawn}
}

const rangeToIls = (start: Dayjs, end: Dayjs) => {
    const list = rangeList(start, end);

    return {
        deposit: listToIls(list, TransactionTypes.DEPOSIT),
        withdrawn: listToIls(list, TransactionTypes.WITHDRAWN)
    }
}

const listToIls = (list: Transaction[], type: TransactionTypes) => {
    return list
        .filter(it => it.type === type)
        .reduce((acc, it) => {
            acc.ILS200 = acc.ILS200 + it.summaryIls?.ILS200 || 0;
            acc.ILS100 = acc.ILS100 + it.summaryIls?.ILS100 || 0;
            acc.ILS50 = acc.ILS50 + it.summaryIls?.ILS50 || 0;
            acc.ILS20 = acc.ILS20 + it.summaryIls?.ILS20 || 0;

            return acc;
        }, {ILS200: 0, ILS100: 0, ILS50: 0, ILS20: 0})
}

const logToAmounts = (log: SupervisorLog) => {
    const logDeposit =  Object.entries(log.deposit)
        .reduce((acc, [banknote, count]) => acc += BANCNOTE_MAP[banknote] * count, 0);
    const logWithdrawn =  Object.entries(log.withdrawn)
        .reduce((acc, [banknote, ils]) => acc += BANCNOTE_MAP[banknote] * (ils.dispensed || 0), 0);

    return {logDeposit, logWithdrawn, logAmount: logDeposit + logWithdrawn}
}

const rangeToAmounts = (start: Dayjs, end: Dayjs) => {
    const list = rangeList(start, end);

    const deposit = list.filter(it => it.type === TransactionTypes.DEPOSIT)
        .reduce((acc, it) => acc += it.amountFinal, 0)
    const withdrawn = list.filter(it => it.type === TransactionTypes.WITHDRAWN)
        .reduce((acc, it) => acc += it.amountFinal, 0)

    return {deposit, withdrawn, amount: deposit + withdrawn}
}

const rangeList = (start: Dayjs, end: Dayjs) => {
    return  useAppStore.getState().transactions
        .filter(it => (it.date > start && it.date < end)
        && (it.type === TransactionTypes.DEPOSIT || it.type === TransactionTypes.WITHDRAWN));
}
