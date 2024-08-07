import styled from "styled-components";

export const SidebarStyled = styled.div`
    display: flex;
  flex-direction: column;
  width: 150px;
  background-color: white;
  align-items: center;
  padding: 54px 12px;
  
  a{
    text-decoration: none;
  }
  
  .logo{
    width: 98px;
    height: 71px;
    margin-bottom: 61px;
  }
  
  .item{
    display: flex;
    width: 100%;
    flex-direction: column;
    font-size: 18px;
    font-weight: 500;
    line-height: 21.48px;
    text-align: center;
    justify-content: center;
    align-items: center;
    padding: 14px;
    border-radius: 14px;
    color: #6071FF;
    margin-bottom: 25px;
    cursor: pointer;
    
    svg{
      margin-top: 8px;
      width: 35px;
      height: 35px;
    }
    
    &.active, &:hover{
      background: #9475FF14;
    }

    &.disabled{
      pointer-events: none;
      opacity: 0.6;
      filter: grayscale();
    }
  }
`
