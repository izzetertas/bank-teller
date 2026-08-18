import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Field, TextInput } from '@/components/ui';

describe('Field', () => {
  it('associates the caption with the wrapped control', () => {
    render(
      <Field label="Customer name">
        <TextInput defaultValue="Ada" />
      </Field>,
    );
    expect(screen.getByLabelText('Customer name')).toHaveValue('Ada');
  });

  it('renders the caption text visibly', () => {
    render(
      <Field label="Search accounts">
        <TextInput />
      </Field>,
    );
    expect(screen.getByText('Search accounts')).toBeVisible();
  });
});
