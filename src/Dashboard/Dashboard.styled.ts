import styled from "styled-components";

export const DashboardStyled = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  
  .row{
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 25px;

    >div{
      width: 49%;
      min-height: 150px;
      background-color: white;
      border-radius: 10px;
    }
  }
`
