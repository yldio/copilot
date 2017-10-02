import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';
import { Col, Row } from 'react-styled-flexboxgrid';
import remcalc from 'remcalc';
import unitcalc from 'unitcalc';
import { LayoutContainer } from '@components/layout';
import { Title } from '@components/navigation';
import { withNotFound } from '@containers/navigation';

import { FormGroup, Toggle, ToggleList, Legend } from 'joyent-ui-toolkit';

const StyledLegend = Legend.extend`
  float: left;
  margin-bottom: ${unitcalc(1.5)};
`;

const PaddedRow = Row.extend`margin-bottom: ${remcalc(18)};`;

const ToggleStyled = styled(Toggle)`
  & + label {
    padding: ${remcalc(16)};
  }
`;

export const ServicesMenu = ({ location: { pathname }, history: { push } }) => {
  const toggleValue = pathname.split('-').pop();

  const handleToggle = evt => {
    const value = evt.target.value;
    if (value !== toggleValue) {
      const index = pathname.lastIndexOf('-');
      const path = `${pathname.slice(0, index)}-${value}`;
      push(path);
    }
  };

  return (
    <LayoutContainer plain>
      <Title>Services</Title>
      <PaddedRow>
        <Col xs={5}>
          <StyledLegend>Show</StyledLegend>
          <FormGroup name="service-view" value={toggleValue}>
            <ToggleList>
              <ToggleStyled value="list" onChange={handleToggle}>
                List
              </ToggleStyled>
              <ToggleStyled value="topology" onChange={handleToggle}>
                Topology
              </ToggleStyled>
            </ToggleList>
          </FormGroup>
        </Col>
      </PaddedRow>
    </LayoutContainer>
  );
};

ServicesMenu.propTypes = {
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default compose(withNotFound())(ServicesMenu);
