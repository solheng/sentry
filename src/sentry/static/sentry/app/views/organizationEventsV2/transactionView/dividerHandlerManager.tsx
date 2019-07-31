import React from 'react';

import {rectOfContent, clamp} from './utils';

// divider handle is positioned at 50% width from the left-hand side
const DEFAULT_DIVIDER_POSITION = 0.5;

export type DividerHandlerManagerChildrenProps = {
  dividerPosition: number;
  isDragging: boolean;
  dividerHandleHovering: boolean;
  dividerHandlePosition: number;
  setHover: (nextHover: boolean) => void;
  onDragStart: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

type PropType = {
  children: (props: DividerHandlerManagerChildrenProps) => JSX.Element;
  interactiveLayerRef: React.RefObject<HTMLDivElement>;
};

type StateType = {
  dividerPosition: number; // between 0 and 1
  dividerHandlePosition: number; // between 0 and 1
  isDragging: boolean;
  dividerHandleHovering: boolean;
};

class DividerHandlerManager extends React.Component<PropType, StateType> {
  state: StateType = {
    dividerPosition: DEFAULT_DIVIDER_POSITION,
    dividerHandlePosition: DEFAULT_DIVIDER_POSITION,
    isDragging: false,
    dividerHandleHovering: false,
  };

  previousUserSelect: string | null = null;

  hasInteractiveLayer = (): boolean => {
    return !!this.props.interactiveLayerRef.current;
  };

  setHover = (nextHover: boolean) => {
    this.setState({
      dividerHandleHovering: nextHover,
    });
  };

  onDragStart = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (
      this.state.isDragging ||
      event.type !== 'mousedown' ||
      !this.hasInteractiveLayer()
    ) {
      return;
    }

    event.stopPropagation();

    // prevent the user from selecting things outside the minimap when dragging
    // the mouse cursor outside the minimap

    this.previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    // attach event listeners so that the mouse cursor does not select text during a drag
    window.addEventListener('mousemove', this.onDragMove);
    window.addEventListener('mouseup', this.onDragEnd);

    // indicate drag has begun

    this.setState({
      isDragging: true,
    });
  };

  onDragMove = (event: MouseEvent) => {
    if (
      !this.state.isDragging ||
      event.type !== 'mousemove' ||
      !this.hasInteractiveLayer()
    ) {
      return;
    }

    const rect = rectOfContent(this.props.interactiveLayerRef.current!);

    // mouse x-coordinate relative to the interactive layer's left side
    const rawMouseX = (event.pageX - rect.x) / rect.width;

    const min = 0;
    const max = 1;

    this.setState({
      // clamp rawMouseX to be within [0, 1]
      dividerHandlePosition: clamp(rawMouseX, min, max),
    });
  };

  onDragEnd = (event: MouseEvent) => {
    if (
      !this.state.isDragging ||
      event.type !== 'mouseup' ||
      !this.hasInteractiveLayer()
    ) {
      return;
    }

    // remove listeners that were attached in onDragStart

    this.cleanUpListeners();

    // restore body styles

    document.body.style.userSelect = this.previousUserSelect;
    this.previousUserSelect = null;

    // indicate drag has ended

    this.setState(state => {
      return {
        isDragging: false,
        // commit dividerHandlePosition to be dividerPosition
        dividerPosition: state.dividerHandlePosition,
      };
    });
  };

  cleanUpListeners = () => {
    if (this.state.isDragging) {
      window.removeEventListener('mousemove', this.onDragMove);
      window.removeEventListener('mouseup', this.onDragEnd);
    }
  };

  render() {
    const childrenProps = {
      dividerPosition: this.state.dividerPosition,
      setHover: this.setHover,
      dividerHandleHovering: this.state.dividerHandleHovering,
      dividerHandlePosition: this.state.dividerHandlePosition,
      isDragging: this.state.isDragging,
      onDragStart: this.onDragStart,
    };

    return this.props.children(childrenProps);
  }
}

export default DividerHandlerManager;
