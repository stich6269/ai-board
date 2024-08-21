import {TableStyled} from "./Table.styled.ts";
import {useEffect, useState} from "react";
import {
    getIlsRangeStatistic,
    ILSRangeStatistic,
    useSupervisorStore
} from "../../../../data/supervisor";
import classNames from "classnames";
export const Table = () => {
    const [stat, setStat] = useState<ILSRangeStatistic>();
    const start = useSupervisorStore(s => s.start);

    useEffect(() => {
        setStat(getIlsRangeStatistic());
    }, [start])

    return (
        <TableStyled>
            <div className="row head">
                <div className="cell">Bills</div>
                <div className="cell">Withdrawn</div>
                <div className="cell">Deposit</div>
            </div>

            <div className="row labels">
                <div className="cell"></div>
                <div className="cell">
                    <div>Actual</div>
                    <div>in Log</div>
                </div>
                <div className="cell">
                    <div>Actual</div>
                    <div>in Log</div>
                </div>
            </div>


            <div className="row">
                <div className="cell">
                    <div className="icon ils200"></div>
                </div>

                <div className="cell">
                    <div>{stat?.actual.withdrawn.ILS200}</div>
                    <div className={classNames({error: stat?.actual.withdrawn.ILS200 !== stat?.log.withdrawn.ILS200})}>
                        {stat?.log.withdrawn.ILS200}
                    </div>
                </div>
                <div className="cell">
                    <div>{stat?.actual.deposit.ILS200}</div>
                    <div className={classNames({error: stat?.actual.deposit.ILS200 !== stat?.log.deposit.ILS200})}>
                        {stat?.log.deposit.ILS200}
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="cell">
                    <div className="icon ils100"></div>
                </div>
                <div className="cell">
                    <div>{stat?.actual.withdrawn.ILS100}</div>
                    <div className={classNames({error: stat?.actual.withdrawn.ILS100 !== stat?.log.withdrawn.ILS100})}>
                        {stat?.log.withdrawn.ILS100}
                    </div>
                </div>
                <div className="cell">
                    <div>{stat?.actual.deposit.ILS100}</div>
                    <div className={classNames({error: stat?.actual.deposit.ILS100 !== stat?.log.deposit.ILS100})}>
                        {stat?.log.deposit.ILS100}
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="cell">
                    <div className="icon ils50"></div>
                </div>
                <div className="cell">
                    <div>{stat?.actual.withdrawn.ILS50}</div>
                    <div className={classNames({error: stat?.actual.withdrawn.ILS50 !== stat?.log.withdrawn.ILS50})}>
                        {stat?.log.withdrawn.ILS50}
                    </div>
                </div>
                <div className="cell">
                    <div>{stat?.actual.deposit.ILS50}</div>
                    <div className={classNames({error: stat?.actual.deposit.ILS50 !== stat?.log.deposit.ILS50})}>
                        {stat?.log.deposit.ILS50}
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="cell">
                    <div className="icon ils20"></div>
                </div>
                <div className="cell">
                    <div>{stat?.actual.withdrawn.ILS20}</div>
                    <div className={classNames({error: stat?.actual.withdrawn.ILS20 !== stat?.log.withdrawn.ILS20})}>
                        {stat?.log.withdrawn.ILS20}
                    </div>
                </div>
                <div className="cell">
                    <div>{stat?.actual.deposit.ILS20}</div>
                    <div className={classNames({error: stat?.actual.deposit.ILS20 !== stat?.log.withdrawn.ILS20})}>
                        {stat?.log.deposit.ILS20}
                    </div>
                </div>
            </div>

        </TableStyled>
    )
}
