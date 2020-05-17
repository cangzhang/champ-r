/* eslint react-hooks/exhaustive-deps: 0 */
import { useEffect, useRef } from 'react';
import ReactGA from 'react-ga';

import config from 'src/native/config';

const trackingID = 'UA-166772221-1';

export default function UseGA({ page }) {
  const ga = useRef(null);

  useEffect(() => {
    new Promise((resolve) => {
      (function (i, s, o, g, r, a, m) {
        i.GoogleAnalyticsObject = r;
        // eslint-disable-next-line no-unused-expressions
        (i[r] =
          i[r] ||
          function () {
            (i[r].q = i[r].q || []).push(arguments);
          })((i[r].l = 1 * new Date()));
        // eslint-disable-next-line no-unused-expressions
        a = s.createElement(o);
        m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        a.addEventListener('load', resolve);
        m.parentNode.insertBefore(a, m);
      })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
      window.ga('create', trackingID, 'auto');
      window.ga('send', 'pageview');
    }).then(() => {
      ReactGA.initialize('UA-166772221-1', {
        gaOptions: {
          userId: config.get(`userId`),
        },
      });

      if (page) {
        ReactGA.pageview(page);
      }

      ga.current = ReactGA.ga();
    });
  }, []);

  return ga.current;
}
