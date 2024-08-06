import {Sidebar} from "./components/Sidebar";
import {AppStyled} from "./App.styled.ts";
import {Stats} from "./components/Stats";
import {Barchart} from "./components/BarChart";
import {APPPieChart} from "./components/PieChart";
import {Control} from "./components/Control";
import {Table} from "./components/Table";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'

dayjs.extend(customParseFormat)
dayjs.extend(utc)


function App() {
    return (
        <AppStyled>
            <Sidebar />

            <div className="content">
                <Control />
                <Stats />

                <div className="row">
                    <Barchart />
                    <APPPieChart />
                </div>

                <Table />
            </div>
        </AppStyled>
    )
}

export default App
