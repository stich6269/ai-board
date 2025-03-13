import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import {Logo} from "./Header.styled.ts";


export const Header = () => {
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Logo variant="h6" sx={{mr: 2}}>AI Board</Logo>
          
          <Tooltip title="Artem Polishchuk">
            <IconButton sx={{ p: 0 }}>
              <Avatar alt="AP" src="/static/images/avatar/3.jpg" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </Container>
    </AppBar>
  );
}