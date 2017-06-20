import React, { Component } from 'react';
import styled from 'styled-components';
import unitcalc from 'unitcalc';
import theme from '../theme';
import Button from '../button';
import { CloseIcon } from '../icons';

const StyledCloseButton = Button.extend`
  background-color: ${theme.white};
  padding: ${unitcalc(2)};
  min-width: auto;
  border: none;
  box-shadow: none;

  &:hover,
  &:focus,
  &:active,
  &:active:hover,
  &:active:focus {
    background-color: ${theme.white};
    border: none;
    box-shadow: none;
  }
`;

/**
 * @example ./usage.md
 */
const CloseButton = props =>
  <StyledCloseButton {...props}>
    <CloseIcon />
  </StyledCloseButton>;

export default CloseButton;