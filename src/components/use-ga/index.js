/* eslint react-hooks/exhaustive-deps: 0 */
import { useEffect, useRef } from 'react';
import ReactGA from 'react-ga';

import config from 'src/native/config';

export default function UseGA({ page }) {
  const ga = useRef(null);

  useEffect(() => {
    ReactGA.initialize('UA-166772221-1', {
      gaOptions: {
        userId: config.get(`userId`),
      },
    });

    if (page) {
      ReactGA.pageview(page);
    }

    ga.current = ReactGA.ga();
  }, []);

  return ga.current;
}
