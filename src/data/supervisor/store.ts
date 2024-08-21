import { create } from 'zustand'
import dataJSON from '../../assets/supervisor.json';
import dayjs, {Dayjs} from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(utc)
dayjs.extend(customParseFormat)

export interface SupervisorDepositILS{
    "ILS200": number;
    "ILS100": number;
    "ILS50": number;
    "ILS20": number;
}

export interface WithdrawnILS{
    "cassette": number;
    "rejected": number;
    "remaining": number;
    "dispensed": number;
    "total": number;
}

export interface SupervisorWithdrawnILS{
    ILS200: WithdrawnILS;
    ILS50: WithdrawnILS;
    ILS100: WithdrawnILS;
    ILS20: WithdrawnILS;
}

export interface SupervisorLog {
    type: 'SUPERVISOR_MODE',
    amount: number,
    number: string,
    date: Dayjs,
    summary?: string;
    id: number;
    amountFinal: number;
    deposit: SupervisorDepositILS;
    withdrawn: SupervisorWithdrawnILS;
    isFirst?: boolean;
    isLast?: boolean;
}
export interface SupervisorStore {
    logs: SupervisorLog[];
    start?: SupervisorLog;
    end?: SupervisorLog;
}

export const useSupervisorStore = create<SupervisorStore>()(
    (): SupervisorStore => ({
        logs: dataJSON
            .map((it: any) => {
                return {
                    ...it,
                    amount: it.amount && +it.amount,
                    number: it.number + '',
                    date: dayjs.utc(it.date, 'DD/MM/YYYY:HH:mm').set("second", 0).set("milliseconds", 0)
                }
            })
            .sort(it => it.date)
            .map((it, i, arr) => ({
                ...it,
                id: i,
                isFirst: i === 0,
                isLast: i === arr.length - 1
            }))
    })
)
