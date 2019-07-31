import React from 'react';
import styled from 'react-emotion';
import {get} from 'lodash';

import {t} from 'app/locale';

import {SpanType, SpanChildrenLookupType, ParsedTraceType} from './types';
import {boundsGenerator, SpanBoundsType, SpanGeneratedBoundsType} from './utils';
import {DragManagerChildrenProps} from './dragManager';
import Span from './span';
import {SpanRowMessage} from './styles';
import DividerHandlerManager, {
  DividerHandlerManagerChildrenProps,
} from './dividerHandlerManager';

type RenderedSpanTree = {
  spanTree: JSX.Element | null;
  numOfHiddenSpansAbove: number;
};

type PropType = {
  traceViewRef: React.RefObject<HTMLDivElement>;
  trace: ParsedTraceType;
  dragProps: DragManagerChildrenProps;
};

class SpanTree extends React.Component<PropType> {
  renderSpan = ({
    treeDepth,
    numOfHiddenSpansAbove,
    spanID,
    traceID,
    lookup,
    span,
    generateBounds,
    pickSpanBarColour,
    dividerHandlerChildrenProps,
  }: {
    treeDepth: number;
    numOfHiddenSpansAbove: number;
    spanID: string;
    traceID: string;
    span: Readonly<SpanType>;
    lookup: Readonly<SpanChildrenLookupType>;
    generateBounds: (bounds: SpanBoundsType) => SpanGeneratedBoundsType;
    pickSpanBarColour: () => string;
    dividerHandlerChildrenProps: DividerHandlerManagerChildrenProps;
  }): RenderedSpanTree => {
    const spanBarColour: string = pickSpanBarColour();

    const spanChildren: Array<SpanType> = get(lookup, spanID, []);

    const bounds = generateBounds({
      startTimestamp: span.start_timestamp,
      endTimestamp: span.timestamp,
    });

    const isCurrentSpanHidden = bounds.end <= 0 || bounds.start >= 1;

    type AccType = {
      renderedSpanChildren: Array<JSX.Element>;
      numOfHiddenSpansAbove: number;
    };

    const reduced: AccType = spanChildren.reduce(
      (acc: AccType, spanChild) => {
        const key = `${traceID}${spanChild.span_id}`;

        const results = this.renderSpan({
          treeDepth: treeDepth + 1,
          numOfHiddenSpansAbove: acc.numOfHiddenSpansAbove,
          span: spanChild,
          spanID: spanChild.span_id,
          traceID,
          lookup,
          generateBounds,
          pickSpanBarColour,
          dividerHandlerChildrenProps,
        });

        acc.renderedSpanChildren.push(
          <React.Fragment key={key}>{results.spanTree}</React.Fragment>
        );

        acc.numOfHiddenSpansAbove = results.numOfHiddenSpansAbove;

        return acc;
      },
      {
        renderedSpanChildren: [],
        numOfHiddenSpansAbove: isCurrentSpanHidden ? numOfHiddenSpansAbove + 1 : 0,
      }
    );

    const showHiddenSpansMessage = !isCurrentSpanHidden && numOfHiddenSpansAbove > 0;

    const hiddenSpansMessage = showHiddenSpansMessage ? (
      <SpanRowMessage>
        <span>
          {t('Number of hidden spans:')} {numOfHiddenSpansAbove}
        </span>
      </SpanRowMessage>
    ) : null;

    return {
      numOfHiddenSpansAbove: reduced.numOfHiddenSpansAbove,
      spanTree: (
        <React.Fragment>
          {hiddenSpansMessage}
          <Span
            span={span}
            generateBounds={generateBounds}
            treeDepth={treeDepth}
            numOfSpanChildren={spanChildren.length}
            renderedSpanChildren={reduced.renderedSpanChildren}
            spanBarColour={spanBarColour}
            dividerHandlerChildrenProps={dividerHandlerChildrenProps}
          />
        </React.Fragment>
      ),
    };
  };

  renderRootSpan = (
    dividerHandlerChildrenProps: DividerHandlerManagerChildrenProps
  ): RenderedSpanTree => {
    const {dragProps, trace} = this.props;

    const rootSpan: SpanType = {
      trace_id: trace.traceID,
      parent_span_id: void 0,
      span_id: trace.rootSpanID,
      start_timestamp: trace.traceStartTimestamp,
      timestamp: trace.traceEndTimestamp,
      op: 'transaction',
      data: {},
    };

    const COLORS = ['#e9e7f7', '#fcefde', '#fffbee', '#f1f5fb'];
    let current_index = 0;

    const pickSpanBarColour = () => {
      const next_colour = COLORS[current_index];

      current_index++;
      current_index = current_index % COLORS.length;

      return next_colour;
    };

    const generateBounds = boundsGenerator({
      traceStartTimestamp: trace.traceStartTimestamp,
      traceEndTimestamp: trace.traceEndTimestamp,
      viewStart: dragProps.viewWindowStart,
      viewEnd: dragProps.viewWindowEnd,
    });

    return this.renderSpan({
      treeDepth: 0,
      numOfHiddenSpansAbove: 0,
      span: rootSpan,
      spanID: rootSpan.span_id,
      traceID: rootSpan.trace_id,
      lookup: trace.lookup,
      generateBounds,
      pickSpanBarColour,
      dividerHandlerChildrenProps,
    });
  };

  render() {
    return (
      <DividerHandlerManager interactiveLayerRef={this.props.traceViewRef}>
        {(dividerHandlerChildrenProps: DividerHandlerManagerChildrenProps) => {
          const {spanTree, numOfHiddenSpansAbove} = this.renderRootSpan(
            dividerHandlerChildrenProps
          );

          const hiddenSpansMessage =
            numOfHiddenSpansAbove > 0 ? (
              <SpanRowMessage>
                <span>
                  {t('Number of hidden spans:')} {numOfHiddenSpansAbove}
                </span>
              </SpanRowMessage>
            ) : null;

          return (
            <TraceViewContainer innerRef={this.props.traceViewRef}>
              {spanTree}
              {hiddenSpansMessage}
            </TraceViewContainer>
          );
        }}
      </DividerHandlerManager>
    );
  }
}

const TraceViewContainer = styled('div')`
  overflow-x: hidden;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
`;

export default SpanTree;
