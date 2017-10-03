import React from 'react';
import remcalc from 'remcalc';
import { Row } from 'react-styled-flexboxgrid';
import is from 'styled-is';
import {
  Button,
  Divider,
  H3,
  P,
  typography,
  Card,
  Message
} from 'joyent-ui-toolkit';
import forceArray from 'force-array';
import styled from 'styled-components';

import { EEditor } from './editors';

const ButtonsRow = Row.extend`margin: ${remcalc(29)} 0 ${remcalc(60)} 0;`;

const ServiceEnvironmentTitle = P.extend`
  margin: ${remcalc(13)} 0 0 0;

  ${is('expanded')`
    margin-bottom: ${remcalc(13)};
  `};
`;

const ServiceName = H3.extend`
  margin-top: 0;
  margin-bottom: ${remcalc(5)};
  line-height: 1.6;
  font-size: ${remcalc(18)};
`;

const ImageTitle = H3.extend`
  display: inline-block;
  margin: 0;
`;

const Image = styled.span`
  ${typography.fontFamily};
  font-size: ${remcalc(15)};
`;

const ServiceDivider = Divider.extend`
  margin: ${remcalc(13)} ${remcalc(-20)} 0 ${remcalc(-20)};
`;

const ServiceCard = Card.extend`
  padding: ${remcalc(13)} ${remcalc(19)};
  min-height: initial;
`;

const Dl = styled.dl`margin: 0;`;

const Chevron = styled.svg`
  transform: ;
  float: right;
  position: relative;
  margin-top: 16px;
  transform: ${props =>
    props.down ? 'rotate(90deg) scale(3)' : 'rotate(270deg) scale(3)'};
`;

const EnvironmentReview = ({ environment }) => {
  const value = environment
    .map(({ name, value }) => `${name}=${value}`)
    .join('\n');

  return <EEditor readOnly input={{ value }} />;
};

export const Review = ({
  handleSubmit,
  onEnvironmentToggle = () => null,
  onCancel,
  dirty,
  loading,
  environmentToggles,
  datacenter,
  ...state
}) => {
  console.log(datacenter);
  const serviceList = forceArray(state.services).map(({ name, config }) => (
    <ServiceCard key={name}>
      <ServiceName>{name}</ServiceName>
      <Dl>
        <dt>
          <ImageTitle>Image:</ImageTitle> <Image>{config.image}</Image>
        </dt>
      </Dl>
      {config.environment && config.environment.length ? (
        <ServiceDivider />
      ) : null}
      {config.environment && config.environment.length ? (
        <ServiceEnvironmentTitle
          expanded={environmentToggles[name]}
          onClick={() => onEnvironmentToggle(name)}
        >
          Environment variables{' '}
          { /* I'M SORRY */ }
          <Chevron
            width="20"
            height="7"
            viewBox="0 0 10 20"
            down={!environmentToggles[name]}
          >
            <path
              fill="#464646"
              d="M 1.1206 0L 0 1.36044L 3.49581 4.8L 0 8.23956L 1.1206 9.6L 6 4.8L 1.1206 0Z"
            />
          </Chevron>
        </ServiceEnvironmentTitle>
      ) : null}
      {config.environment &&
      config.environment.length &&
      environmentToggles[name] ? (
        <EnvironmentReview environment={config.environment} />
      ) : null}
    </ServiceCard>
  ));

  return (
    <form onSubmit={handleSubmit}>
      <Message
        title="Reviewing"
        message="Review names of services, images being used and packages you chose or that have been recommended to you"
        type="EDUCATIONAL"
      />
      {serviceList}
      <P>A single instance of each service will be deployed.</P>
      <ButtonsRow>
        <Button type="button" onClick={onCancel} disabled={loading} secondary>
          Cancel
        </Button>
        <Button loading={loading} type="submit">
          Confirm and Deploy
        </Button>
      </ButtonsRow>
    </form>
  );
};

export default Review;
