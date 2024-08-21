import styled from "styled-components";
import Bills from '../../../../assets/bills.png'

export const TableStyled = styled.div`
  background-color: white;
  border-radius: 10px;
  margin-bottom: 16px;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  font-size: 15px;
  font-weight: 500;
  line-height: 17.9px;
  text-align: center;
  color: #8690A5;

  .row{
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 60px;
    justify-content: space-between;
    width: 100%;
    text-align: center;
    border-bottom: 1px solid #EAEAEA;
    
    &:last-child{
      border-bottom: none;
    }
    
    &.head{
      height: 42px;
      .cell{
        justify-content: center;
        color: #8690A5;
        font-size: 15px;
        font-weight: 500;
        line-height: 17.9px;
        text-align: center;
      }
    }
    
    &.labels{
      height: 38px;

      .cell{
        font-size: 12px;
        font-weight: 500;
        line-height: 14.32px;
        text-align: center;
        color: #8690A5;
      }
    }
    
    .cell{
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 160px;
      font-size: 15px;
      font-weight: 700;
      line-height: 17.9px;
      text-align: center;
      color: black;

      >div{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        
        &.error{
          color: #FC442C;
        }
      }
      
      &:nth-child(1){
        max-width: 72px;
        justify-content: center;
      }
      
      .icon{
        display: flex;
        width: 72px;
        height: 42px;
        background-image: url("${Bills}");
        
        &.ils200{
          background-position: 225px -7px;
          background-size: 152px 186px;
        }
        &.ils100{
          background-position: -6px -55px;
          background-size: 158px 194px;
        }
        &.ils50{
          background-position: -11px -100px;
          background-size: 167px 194px;
        }
        &.ils20{
          background-position: -16px -147px;
          background-size: 176px 194px;
        }
      }
    }
  }
`
