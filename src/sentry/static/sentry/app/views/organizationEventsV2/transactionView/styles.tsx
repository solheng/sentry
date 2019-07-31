import styled from 'react-emotion';

import space from 'app/styles/space';

export const SPAN_ROW_HEIGHT = 25;

export const SpanRow = styled('div')`
  position: relative;
  overflow: hidden;

  min-height: ${SPAN_ROW_HEIGHT}px;

  cursor: pointer;
  transition: background-color 0.15s ease-in-out;

  &:last-child {
    & > [data-component='span-detail'] {
      border-bottom: none !important;
    }
  }

  &:hover {
    background-color: rgba(189, 180, 199, 0.1);

    & > [data-span='true'] {
      transition: border-color 0.15s ease-in-out;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
  }
`;

export const SpanRowMessage = styled(SpanRow)`
  cursor: auto;

  color: #4a3e56;
  font-size: 12px;
  line-height: ${SPAN_ROW_HEIGHT}px;

  padding-left: ${space(1)};
  padding-right: ${space(1)};

  background-color: #f1f5fb !important;

  outline: 1px solid #c9d4ea;

  z-index: 99999;
`;
