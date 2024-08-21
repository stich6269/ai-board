import styled from "styled-components";

export const HeaderStyled = styled.div`
  background-color: white;
  border-radius: 10px;
  margin-bottom: 16px;
  width: 100%;
  padding: 8px;
  justify-content: space-between;
  display: flex;
  flex-direction: row;
  align-items: center;
  
  button{
    &:hover, &:active{
      border: none;
      outline: none;
    }
  }
  
  .date{
    color: #787878;
    font-size: 19px;
    padding-left: 10px;
  }
`
