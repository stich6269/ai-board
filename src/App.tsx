import {Sidebar} from "./components/Sidebar";
import {AppStyled} from "./App.styled.ts";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekday from 'dayjs/plugin/weekday'
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {Dashboard} from "./Dashboard";
import {Transactions} from "./Transactions";

dayjs.extend(weekday)
dayjs.extend(weekOfYear)
dayjs.extend(customParseFormat)
dayjs.extend(utc)


function App() {
    return (
        <AppStyled>

            <BrowserRouter>
                <Sidebar />

                <div className="content">
                    <Routes>
                        <Route path="/" element={<Navigate to='dashboard' />} />
                        <Route path="/dashboard" element={<Dashboard/>} />
                        <Route path="/transactions" element={<Transactions />} />
                    </Routes>
                </div>
            </BrowserRouter>

        </AppStyled>
    )
}


export default App
