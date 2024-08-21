import {StatisticStyled} from "./Statistic.styled.ts";
import {useEffect, useState} from "react";
import {getRangeStatistic, RangeStatistic, useSupervisorStore} from "../../../../data/supervisor";
import {priceFormatter} from "../../../../utils/priceFormatter.ts";
import classNames from "classnames";
export const Statistic = () => {
    const [stat, setStat] = useState<RangeStatistic>();
    const start = useSupervisorStore(s => s.start);

    useEffect(() => {
        setStat(getRangeStatistic());
    }, [start])

    return (
        <StatisticStyled>
            <div className="cell first">
                <div className="row">
                    <div className="label">Actual Amount</div>
                    <div className="value">{priceFormatter(stat?.amount)}</div>
                </div>

                <div className={classNames('row', {error: stat?.amount! - stat?.logAmount! !== 0})}>
                    <div className="label">Log Amount</div>
                    <div className="value">{priceFormatter(stat?.logAmount)}</div>
                    <div className="difference"><span>
                        {!!(stat?.amount! - stat?.logAmount!) && <>{stat?.amount! - stat?.logAmount! > 0 ? '+' : '-'}</>} {priceFormatter(stat?.amount! - stat?.logAmount!)}
                    </span> vs. actual amount</div>
                </div>
            </div>


            <div className="cell">
                <div className="row">
                    <div className="label">Actual Withdrawn</div>
                    <div className="value">{priceFormatter(stat?.withdrawn)}</div>
                </div>

                <div className={classNames('row', {error: stat?.withdrawn! - stat?.logWithdrawn! !== 0})}>
                    <div className="label">Log Withdrawn</div>
                    <div className="value">{priceFormatter(stat?.logWithdrawn)}</div>
                    <div className="difference"><span>
                        {!!(stat?.withdrawn! - stat?.logWithdrawn!) && <>{stat?.withdrawn! - stat?.logWithdrawn! > 0 ? '+' : '-'}</>} {priceFormatter(stat?.withdrawn! - stat?.logWithdrawn!)}
                    </span> vs. actual withdrawn</div>
                </div>
            </div>

            <div className="cell">
                <div className="row">
                    <div className="label">Actual Deposit</div>
                    <div className="value">{priceFormatter(stat?.deposit)}</div>
                </div>

                <div className={classNames('row', {error: stat?.deposit! - stat?.logDeposit! !== 0})}>
                    <div className="label">Log Deposit</div>
                    <div className="value">{priceFormatter(stat?.logDeposit)}</div>
                    <div className="difference"><span>
                        {!!(stat?.deposit! - stat?.logDeposit!) && <>{stat?.deposit! - stat?.logDeposit! > 0 ? '+' : '-'}</>} {priceFormatter(stat?.deposit! - stat?.logDeposit!)}
                    </span> vs. actual deposit</div>
                </div>
            </div>
        </StatisticStyled>
    )
}
