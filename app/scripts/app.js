(function(document) {
    'use strict';

    // Grab a reference to our auto-binding template
    // and give it some initial binding values
    // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
    let app = document.querySelector('#app');

    app.displayInstalledToast = () => {
        // Check to make sure caching is actually enabled—it won't be in the dev environment.
        if (!document.querySelector('platinum-sw-cache').disabled) {
            document.querySelector('#caching-complete').show();
        }
    };

    // Listen for template bound event to know when bindings
    // have resolved and content has been stamped to the page
    app.addEventListener('dom-change', () => console.log('Hello, folks! It is Project Hoverboard by GDG Lviv. Contact Oleh Zasadnyy for more details.'));

    // See https://github.com/Polymer/polymer/issues/1381
    window.addEventListener('WebComponentsReady', () => { /* imports are loaded and elements have been registered */ });

    // Main area's paper-scroll-header-panel custom condensing transformation of
    // the appName in the middle-container and the bottom title in the bottom-container.
    // The appName is moved to top and shrunk on condensing. The bottom sub title
    // is shrunk to nothing on condensing.
    addEventListener('paper-header-transform', e => {
        let appName = document.querySelector('.Main-headerTitle');
        let middleContainer = document.querySelector('.Main-headerMiddleContent');
        let bottomContainer = document.querySelector('.Main-headerBottomContent');
        let detail = e.detail;
        let heightDiff = detail.height - detail.condensedHeight;
        let yRatio = Math.min(1, detail.y / heightDiff);
        let maxMiddleScale = 0.50; // appName max size when condensed. The smaller the number the smaller the condensed size.
        let scaleMiddle = Math.max(maxMiddleScale, (heightDiff - detail.y) / (heightDiff / (1 - maxMiddleScale)) + maxMiddleScale);
        let scaleBottom = 1 - yRatio;

        // Move/translate middleContainer
        Polymer.Base.transform(`translate3d(0,${yRatio * 100}%,0)`, middleContainer);

        // Scale bottomContainer and bottom sub title to nothing and back
        Polymer.Base.transform(`scale(${scaleBottom}) translateZ(0)`, bottomContainer);

        // Scale middleContainer appName
        Polymer.Base.transform(`scale(${scaleMiddle}) translateZ(0)`, appName);
    });

    // Scroll page to top and expand header
    app.scrollPageToTop = () => document.getElementById('mainContainer').scrollTop = 0;
    app.generateClass = (value) => value.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
})(document);
