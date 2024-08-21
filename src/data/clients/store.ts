import { create } from 'zustand'
import dataJSON from '../../assets/data.json';
import dayjs, {Dayjs} from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from "dayjs/plugin/utc";

dayjs.extend(utc)
dayjs.extend(customParseFormat)


export enum TransactionTypes {
    'FAILED_CUSTOMER' = 'FAILED_CUSTOMER',
    'WITHDRAWN' = 'WITHDRAWN',
    'OTHER_TRAN' = 'OTHER_TRAN',
    'DEPOSIT' = 'DEPOSIT',
    'OTHER' = 'OTHER',
    'FAILED_ATM' = 'FAILED_ATM',
    'SUPERVISOR_MODE' = 'SUPERVISOR_MODE',
    'undefined' = 'undefined'
}

export interface UserILS{
    "ILS200": number;
    "ILS100": number;
    "ILS50": number;
    "ILS20": number;
}

export interface Transaction {
    type: TransactionTypes,
    amount: number,
    number: string,
    date: Dayjs,
    summary?: string;
    id: string;
    summaryIls: UserILS;
    amountFinal: number;
}
export interface AppStore {
    transactions: Transaction[];
    selectedDate?: Dayjs;
    selectedWeek?: number;
}

export const useAppStore = create<AppStore>()(
    (): AppStore => ({
        selectedDate: dayjs(),
        transactions: dataJSON.map((it: any, i) => {
            return {
                ...it,
                id: i,
                amount: it.amount && +it.amount,
                number: it.number + '',
                date: dayjs.utc(it.date, 'DD/MM/YYYY:HH:mm').set("second", 0).set("milliseconds", 0)
            }
        }).sort(it => it.date)
    })
)
