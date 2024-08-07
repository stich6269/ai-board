import {SidebarStyled} from "./Sidebar.styled.ts";
import Logo from '../../assets/logo.png'
import GridViewIcon from '@mui/icons-material/GridView';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ArticleIcon from '@mui/icons-material/Article';
import {NavLink} from "react-router-dom";
export const Sidebar = () => {
    return (
        <SidebarStyled>
            <img className='logo' src={Logo} alt=""/>

            <NavLink
                to="/dashboard"
                className={({ isActive }) => isActive ? "item active" : "item"}
            >
                Dashboard <GridViewIcon />
            </NavLink>;

            <NavLink
                to="/transactions"
                className={({ isActive }) => isActive ? "item active" : "item"}
            >
                Transactions <AccountBalanceIcon />
            </NavLink>;

            <div className="item disabled">
                ATM <LocalAtmIcon />
            </div>

            <div className="item disabled">
                Logs <ArticleIcon />
            </div>
        </SidebarStyled>
    )
}
