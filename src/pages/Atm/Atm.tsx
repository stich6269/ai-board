import {AtmStyled} from "./Atm.styled.ts";
import {Header} from "./components/Header";
import {Statistic} from "./components/Statistic";
import {Table} from "./components/Table";

export const Atm = () => {
    return (
        <AtmStyled>
            <Header />
            <Statistic />
            <Table />

        </AtmStyled>
    )
}
