import React from 'react';
import PropTypes from 'prop-types';
import remcalc from 'remcalc';
import styled from 'styled-components';
import { isOr } from 'styled-is';
import titleCase from 'title-case';

import {
  Card,
  CardInfo,
  CardView,
  CardTitle,
  CardDescription,
  HealthyIcon,
  Label
} from 'joyent-ui-toolkit';

const STATUSES = [
  'PROVISIONING',
  'READY',
  'ACTIVE',
  'RUNNING',
  'STOPPING',
  'STOPPED',
  'OFFLINE',
  'DELETED',
  'DESTROYED',
  'FAILED',
  'INCOMPLETE',
  'UNKNOWN'
];

const Dot = styled.span`
  margin-right: ${remcalc(6)};
  width: ${remcalc(6)};
  height: ${remcalc(6)};
  border-radius: ${remcalc(3)};
  display: inline-block;

  ${isOr('provisioning', 'ready', 'active', 'running')`
    background-color: ${props => props.theme.green};
  `};

  ${isOr('stopping', 'stopped')`
    background-color: ${props => props.theme.grey};
  `};

  ${isOr('offline', 'destroyed', 'failed')`
    background-color: ${props => props.theme.red};
  `};

  ${isOr('deleted', 'incomplete', 'unknown')`
    background-color: ${props => props.theme.secondaryActive};
  `};
`;

const StyledCard = Card.extend`
  flex-direction: row;

  &:not(:last-child) {
    margin-bottom: 0;
    box-shadow: none;
    border-bottom-width: 0;
  }

  background-color: ${props => props.theme.white};

  ${isOr(
    'stopping',
    'stopped',
    'offline',
    'destroyed',
    'failed',
    'deleted',
    'incomplete',
    'unknown'
  )`
    background-color: ${props => props.theme.background};

    & [name="card-options"] > button {
      background-color: ${props => props.theme.background};
    }`};
`;

const StatusContainer = styled.div`
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const HealthyIconStyled = styled(HealthyIcon)`
  transform: translateY(-50%);
  position: absolute;
`;

const CardInfoStyled = styled.div`
  height: 100%;
  & > div {
    min-width: 115px;
  }
`;

const Status = styled.div`
  display: flex;
  align-items: center;
`;

const InstanceCard = ({
  instance,
  onHealthMouseOver = () => {},
  onStatusMouseOver = () => {},
  onMouseOut = () => {}
}) => {
  const statusProps = STATUSES.reduce(
    (acc, name) =>
      Object.assign(acc, {
        [name.toLowerCase()]: name === instance.status
      }),
    {}
  );

  const label = (instance.healthy || 'UNKNOWN').toLowerCase();
  const icon = <HealthyIconStyled healthy={instance.healthy} />;

  const handleHealthMouseOver = evt => {
    onHealthMouseOver(evt, instance);
  };

  const handleStatusMouseOver = evt => {
    onStatusMouseOver(evt, instance);
  };

  const handleMouseOut = evt => {
    onMouseOut(evt);
  };

  return (
    <StyledCard collapsed={true} key={instance.uuid} {...statusProps}>
      <CardView>
        <CardTitle>{instance.name}</CardTitle>
        <CardDescription>
          <CardInfoStyled>
            <CardInfo
              icon={icon}
              iconPosition="left"
              label={label}
              color="dark"
              onMouseOver={handleHealthMouseOver}
              onMouseOut={handleMouseOut}
            />
          </CardInfoStyled>
        </CardDescription>
        <CardDescription>
          <StatusContainer
            onMouseOver={handleStatusMouseOver}
            onMouseOut={handleMouseOut}
          >
            <Status>
              <Dot {...statusProps} />
              <Label>{titleCase(instance.status)}</Label>
            </Status>
          </StatusContainer>
        </CardDescription>
      </CardView>
    </StyledCard>
  );
};

InstanceCard.propTypes = {
  instance: PropTypes.object.isRequired,
  onHealthMouseOver: PropTypes.func,
  onStatusMouseOver: PropTypes.func,
  onMouseOut: PropTypes.func
};

export default InstanceCard;
