(function (document) {
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
    window.addEventListener('WebComponentsReady', () => { /* imports are loaded and elements have been registered */
    });

    // Scroll page to top and expand header
    app.scrollPageToTop = () => document.getElementById('mainContainer').scrollTop = 0;
    app.generateClass = (value) => value.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
    app.getIndexByProperty = (array, property, value) => {
        for (let i = 0, length = array.length; i < length; i++) {
            if (array[i][property] === value) {
                return i;
            }
        }
    };
})(document);
