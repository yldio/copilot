import styled, { css } from 'styled-components';
import camelCase from 'camel-case';
import { boxes } from '../constants';
import { unitcalc } from '../functions';

const sides = [
  'top',
  'right',
  'bottom',
  'left'
];

const unitProps = (() => {
  const sided = (rule) =>
    sides.map((side) => `${rule}-${side}`);

  const measures = [
    'margin',
    'padding'
  ].reduce((props, rule) => [
    ...props,
    rule,
    ...sided(rule)
  ], []);

  return sides.reduce((acc, side) => [
    ...acc,
    `border-${side}-width`
  ], [
    'border',
    ...measures
  ]);
})();

const unitsFromProps = (props) => unitProps
  .filter((measure) => props[camelCase(measure)])
  .map((measure) => `
    ${measure}: ${unitcalc(props[camelCase(measure)])};
  `)
  .join(';\n');

export const Baseline = (Component) => styled(Component)`
  ${unitsFromProps}
`;

export const verticallyAlignCenter = css`
  /* Need to place position:relative on parent */
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
`;

export const clear = css`
  display: block;
  content: "";
  clear: both;
`;

export const moveZ = ({
  amount = 0,
  position = 'relative'
}) => css`
  position: ${position};
  z-index: ${amount};
`;

export const baseBox = ({
  radius = boxes.borderRadius,
  border = boxes.border.unchecked,
  shadow = boxes.bottomShaddow
} = {}) => css`
  border: ${border};
  border-radius: ${radius};
  box-shadow: ${shadow};
`;

export const pseudoEl = (
  positions = {}
) => css`
  content: "";
  position: absolute;
  top: ${positions.top || 'auto'};
  right: ${positions.right || 'auto'};
  bottom: ${positions.bottom || 'auto'};
  left: ${positions.left || 'auto'};
`;

export const clearfix = css`
  &:before,
  &:after {
    content:"";
    display:table;
  }

  &:after {
    clear:both;
  }
`;

export {
  libreFranklin,
  libreFranklinSemiBold,
  libreFranklinBold,
  bold,
  regular,
  titleColor,
  bodyColor
} from './typography';
