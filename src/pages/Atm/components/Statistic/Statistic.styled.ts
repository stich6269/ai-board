import styled from "styled-components";

export const StatisticStyled = styled.div`
  background-color: white;
  border-radius: 10px;
  margin-bottom: 16px;
  width: 100%;
  justify-content: space-between;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16px 24px;

  .cell{
    display: flex;
    flex-direction: column;
    font-size: 15px;
    font-weight: 500;
    line-height: 17.9px;
    text-align: left;
    color: #8690A5;
    padding-left: 18px;
    border-left: 1px solid #EAEAEA;
    width: 30%;
    
    &.first{
      width: 40%;
      padding-left: 0;
      border-left: none;
    }
    
    span{
      color: #3BC8D6;;
    }
    
    .row{
      margin-bottom: 36px;
      
      &.error:last-child{
        .value{color: #FC442C;}
        span{color: #FC442C;}
      }
      
      &:last-child{
        margin-bottom: 0;
        .value{
          color: #3BC8D6;
        }
      }
      
      .label{
        margin-bottom: 4px;
      }
      
      .value{
        font-size: 28px;
        font-weight: 700;
        line-height: 33.41px;
        text-align: left;
        margin-bottom: 8px;
      }
    }

  }
`
