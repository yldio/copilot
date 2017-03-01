import { Baseline } from '../../shared/composers';
import { colors } from '../../shared/constants';
import PropTypes from './prop-types';
// import HeartIcon from './icon-heart.svg';
import GraphNodeButton from './graph-node-button';
// import GraphNodeInfo from './graph-node-info';
import GraphNodeMetrics from './graph-node-metrics';
import styled from 'styled-components';
import React from 'react';



const StyledRect = styled.rect`
  stroke: ${props => props.connected ?
    colors.base.secondaryActive : colors.base.grey};
  fill: ${props => props.connected ? colors.base.secondary : colors.base.white};
  stroke-width: 1.5;
  rx: 4;
  ry: 4;
`;

const StyledShadowRect = styled.rect`
  fill: ${props => props.connected ? colors.base.secondary : colors.base.grey};
  opacity: 0.33;
  rx: 4;
  ry: 4;
`;

const StyledLine = styled.line`
  stroke: ${props => props.connected ?
    colors.base.secondaryActive : colors.base.grey};
  stroke-width: 1.5;
`;

const StyledText = styled.text`
  fill: ${props => props.connected ? colors.base.white : colors.base.secondary};
  font-size: 16px;
  font-weight: 600;
`;

const HeartCircle = styled.circle`
  fill: ${colors.base.green};
`;

const GraphNode = ({
  connected,
  data,
  index,
  size,
  onDragStart
}) => {

  const {
    width,
    height
  } = size;

  const halfWidth = width/2;
  const halfHeight = height/2;
  const lineY = 48;
  const lineX = 140;
  const buttonRect = {
    x: lineX,
    y: 0,
    width: 40,
    height: 48
  };

  const onButtonClick = (evt) => {
    // console.log('Rect clicked!!!');
  };

  const paddingLeft = 18;
  /*const infoPosition = {
    x: paddingLeft,
    y: 59
  };*/
  const metricsPosition = {
    x: paddingLeft,
    y: 89
  };

  // const titleBbBox = {x:100, y: 30 - halfHeight};
  const onStart = (evt) => {
    evt.preventDefault();
    onDragStart(evt, data.id);
  };

  const position = connected ? {
    x: data.x-halfWidth,
    y: data.y-halfHeight
  } : {
    x: data.x,
    y: data.y
  };

  const nodeRect = connected ? (
    <StyledRect
      x={0}
      y={0}
      width={width}
      height={height}
      onMouseDown={onStart}
      onTouchStart={onStart}
      connected={connected}
    />
  ) : (
    <StyledRect
      x={0}
      y={0}
      width={width}
      height={height}
      connected={connected}
    />
  );

  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      <StyledShadowRect
        x={0}
        y={3}
        width={width}
        height={height}
        connected={connected}
      />
      {nodeRect}
      <StyledLine
        x1={0}
        y1={lineY}
        x2={width}
        y2={lineY}
        connected={connected}
      />
      <StyledLine
        x1={lineX}
        y1={0}
        x2={lineX}
        y2={lineY}
        connected={connected}
      />
      <StyledText
        x={paddingLeft}
        y={30}
        connected={connected}
      >
        {data.name}
      </StyledText>
      <g transform={`translate(${115}, ${15})`}>
        <HeartCircle
          cx={9}
          cy={9}
          r={9}
        />
        {/*<HeartIcon />*/}
      </g>
      <GraphNodeButton
        buttonRect={buttonRect}
        onButtonClick={onButtonClick}
        index={index}
        connected={connected}
      />
      {/*<GraphNodeInfo
        datacentres={data.datacentres}
        instances={data.instances}
        healthy
        infoPosition={infoPosition}
        connected={connected}
      />*/}
      <GraphNodeMetrics
        metrics={data.metrics}
        metricsPosition={metricsPosition}
        connected={connected}
      />
    </g>
  );
};

GraphNode.propTypes = {
  connected: React.PropTypes.bool,
  data: React.PropTypes.object.isRequired,
  index: React.PropTypes.number.isRequired,
  onDragStart: React.PropTypes.func,
  size: PropTypes.Size
};

export default Baseline(
  GraphNode
);
