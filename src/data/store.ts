import { create } from 'zustand'
import dataJSON from '../assets/data.json';
import dayjs, {Dayjs} from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)


export enum TransactionTypes {
    'FAILED_CUSTOMER' = 'FAILED_CUSTOMER',
    'WITHDRAWN' = 'WITHDRAWN',
    'OTHER_TRAN' = 'OTHER_TRAN',
    'DEPOSIT' = 'DEPOSIT',
    'OTHER' = 'OTHER',
    'FAILED_ATM' = 'FAILED_ATM',
    'undefined' = 'undefined'
}
export interface Transaction {
    type: TransactionTypes,
    amount: number,
    id: string,
    date: Dayjs,
    summary?: string
}
export interface AppStore {
    transactions: Transaction[];
    selectedDate: Dayjs;
}

export const useAppStore = create<AppStore>()(
    (): AppStore => ({
        selectedDate: dayjs(),
        transactions: dataJSON.map((it: any) => {
            return {
                ...it,
                amount: it.amount && +it.amount,
                id: it.number + '',
                date: dayjs(it.date, 'DD/MM/YYYY:HH:mm')
            }
        }).sort(it => it.day)
    })
)
