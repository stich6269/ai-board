import styled from "styled-components";

export const StatsStyled = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  border-radius: 10px;
  background-color: white;
  padding: 14px 0;

  .item {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #EAEAEA;
    height: 100%;
    width: 100%;

    font-size: 15px;
    font-weight: 500;
    line-height: 17.9px;
    text-align: left;
    color: #8690A5;
    padding-left: 27px;

    &:last-child {
      border-right: none;
    }

    &:first-child {
      margin-left: 30px;
    }

    .value {
      margin-top: 8px;
      font-size: 28px;
      font-weight: 500;
      line-height: 33.41px;
      text-align: left;
    }

    .change {
      margin-top: 10px;
      color: #3BC8D6;
      
      &:before{
        content: '+';
        margin-right: 4px;
      }

      &.negative {
        color: #f27070;
        &:before{
          content: '-';
        }
      }

      span {
        color: #BABABA;
      }
    }
  }
`
