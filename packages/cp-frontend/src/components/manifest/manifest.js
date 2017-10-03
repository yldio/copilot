import React from 'react';
import { FormGroup, FormMeta, Button } from 'joyent-ui-toolkit';
import { Row } from 'react-styled-flexboxgrid';
import remcalc from 'remcalc';
import { Field } from 'redux-form';
import { MEditor } from './editors';
import StyledFormLabel from './label';

const ButtonsRow = Row.extend`margin: ${remcalc(29)} 0 ${remcalc(60)} 0;`;

export const Manifest = ({
  handleSubmit,
  onCancel,
  dirty,
  defaultValue = '',
  loading
}) => (
  <form onSubmit={handleSubmit}>
    <FormGroup reduxForm>
      <FormMeta left>
        <StyledFormLabel bottomSpace>Project manifest</StyledFormLabel>
      </FormMeta>
      <Field name="manifest" defaultValue={defaultValue} component={MEditor} />
    </FormGroup>
    <ButtonsRow>
      <Button type="button" onClick={onCancel} secondary>
        Cancel
      </Button>
      <Button
        disabled={!(dirty || !loading || defaultValue.length)}
        loading={loading}
        type="submit"
      >
        Next
      </Button>
    </ButtonsRow>
  </form>
);

export default Manifest;
