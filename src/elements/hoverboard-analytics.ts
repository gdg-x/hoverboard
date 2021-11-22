import { TempAny } from '../temp-any';

class HoverboardAnalytics extends HTMLElement {
  connectedCallback() {
    // GOOGLE ANALYTICS TRACKING

    // Load google analytics script
    /* eslint-disable */
    // prettier-ignore
    // @ts-ignore
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
    /* eslint-enable */

    ga('create', {
      trackingId: '{$ analytics $}',
      cookieDomain: 'auto',
      cookiePath: '{$ prefix $}',
      siteSpeedSampleRate: 10,
    });

    ga('require', 'eventTracker');
    ga('require', 'outboundLinkTracker');
    ga('require', 'urlChangeTracker');
    ga('require', 'pageVisibilityTracker');

    ga('set', 'anonymizeIp', true);
    ga('send', 'pageview');

    const updateOnlineStatus = (event) => {
      ga('send', 'event', 'network', 'change', event.type);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('WebComponentsReady', (_error) => {
      if (window.performance) {
        ga(
          'send',
          'timing',
          'JS Dependencies',
          'WebComponentsReady',
          Math.round(performance.now())
        );
      }
    });

    window.onerror = function (message, file, lineNumber, _columnNumber, error) {
      // We don't want to trigger any errors inside window.onerror, so wrap in a try/catch.
      try {
        // Some browsers don't support error param yet.
        if (error !== undefined) {
          message = error.stack;
        }
        ga('send', 'event', 'error', file + ':' + lineNumber, message);
      } catch (e) {
        // no-op
      }
    };

    (window as TempAny).measureDuration = (mark, optReference) => {
      const reference = optReference || 'responseEnd';
      const name = `${reference}:${mark}`;

      // Clears any existing measurements with the same name.
      performance.clearMeasures(name);

      // Creates a new measurement from the reference point to the specified mark.
      // If more than one mark with this name exists, the most recent one is used.
      performance.measure(name, reference, mark);

      // Gets the value of the measurement just created.
      const measure = performance.getEntriesByName(name)[0];

      // Returns the measure duration.
      return measure.duration;
    };
  }
}

window.customElements.define('hoverboard-analytics', HoverboardAnalytics);
