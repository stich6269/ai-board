import styled from "styled-components";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


export const AppStyled = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
  
  .content{
    padding: 30px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    flex-grow: 0;
    height: 100vh;
    overflow: auto;
    
    >div{
      max-width: 1200px;
    }
  }
`
