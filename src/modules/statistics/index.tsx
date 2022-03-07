import React from 'react';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';

import initI18n from 'src/modules/i18n';
import { Content } from './content';
import Toolbar from './toolbar';

initI18n();
const engine = new Styletron();

export default function Statistics() {
  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={LightTheme}>
        <Toolbar />
        <Content />
      </BaseProvider>
    </StyletronProvider>
  );
}
