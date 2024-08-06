import {StatsStyled} from "./Stats.styled.ts";
import {useEffect, useState} from "react";
import {DailySummary, getDailySummary, useAppStore} from "../../data";
import {priceFormatter} from "../../utils/priceFormatter.ts";
import classNames from "classnames";


export const Stats = () => {
    const date = useAppStore(s => s.selectedDate);
    const [stat, setStat] = useState<Partial<DailySummary>>({});

    useEffect(() => {
        setStat(getDailySummary());
    }, [date])

    return (
        <StatsStyled>
            <div className="item">
                <div className="label">Transactions</div>
                <div className="value">{stat.transactions}</div>
                <div className={classNames('change', {negative: stat.change?.transactions! < 0})}>
                    {Math.abs(stat.change?.transactions!)}
                    <span> day before</span>
                </div>
            </div>

            <div className="item">
                <div className="label">Amount</div>
                <div className="value">{priceFormatter(stat.amount)}</div>
                <div className={classNames('change', {negative: stat.change?.amount! < 0})}>
                    {priceFormatter(stat.change?.amount)}
                    <span> day before</span>
                </div>
            </div>

            <div className="item">
                <div className="label">Deposit</div>
                <div className="value">{priceFormatter(stat.deposit)}</div>
                <div className={classNames('change', {negative: stat.change?.deposit! < 0})}>
                    {priceFormatter(stat.change?.deposit)}
                    <span> day before</span>
                </div>
            </div>

            <div className="item">
                <div className="label">Withdrawn</div>
                <div className="value">{priceFormatter(stat.withdrawn)}</div>
                <div className={classNames('change', {negative: stat.change?.withdrawn! < 0})}>
                    {priceFormatter(stat.change?.withdrawn)}
                    <span> day before</span>
                </div>
            </div>
        </StatsStyled>
    )
}
