import {SidebarStyled} from "./Sidebar.styled.ts";
import Logo from '../../assets/logo.png'
import GridViewIcon from '@mui/icons-material/GridView';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ArticleIcon from '@mui/icons-material/Article';
export const Sidebar = () => {
    return (
        <SidebarStyled>
            <img className='logo' src={Logo} alt=""/>

            <div className="item active">
                Dashboard <GridViewIcon />
            </div>

            <div className="item disabled">
                Transactions <AccountBalanceIcon />
            </div>

            <div className="item disabled">
                ATM <LocalAtmIcon />
            </div>

            <div className="item disabled">
                Logs <ArticleIcon />
            </div>
        </SidebarStyled>
    )
}
