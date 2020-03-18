import React, { useState } from 'react';
import { ProgressBar } from 'baseui/progress-bar';

import useInterval from './use-interval';

const Total = 100;
const Step = 2;

export default () => {
  const [value, setValue] = useState(0);

  useInterval(() => {
    if (value + Step < Total) {
      setValue(value + Step);
    } else {
      setValue(100);
    }
  }, 2000);

  return (
    <ProgressBar
      value={value}
      successValue={Total}
      overrides={{
        BarProgress: {
          style: ({ $theme, $value }) => {
            return {
              ...$theme.typography.LabelMedium,
              backgroundColor: $theme.colors.positive,
              color: $theme.colors.mono200,
              position: 'relative',
              ':after': {
                position: 'absolute',
                content: $value > 5 ? `"${$value}%"` : '',
                right: '10px',
              },
            };
          },
        },
        Bar: {
          style: ({ $theme }) => ({
            height: $theme.sizing.scale800,
          }),
        },
      }}
    />
  );
};
