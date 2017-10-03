import { FormLabel } from 'joyent-ui-toolkit';
import styled from 'styled-components';
import remcalc from 'remcalc';

const StyledFormLabel = styled(FormLabel)`
  margin-top: ${remcalc(24)};
  margin-bottom: ${props => props.bottomSpace ? remcalc(16) : remcalc(6)};
`;

export default StyledFormLabel;
