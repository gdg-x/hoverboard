(function (document) {
    'use strict';

    var app = document.querySelector('#app');

    app.displayInstalledToast = () => {
        if (!document.querySelector('platinum-sw-cache').disabled) {
            document.querySelector('#caching-complete').show();
        }
    };

    app.addEventListener('dom-change', () => console.log('Hello, folks! It is Project Hoverboard by GDG Lviv. Contact Oleh Zasadnyy for more details.'));

    app.scrollPageToTop = () => document.querySelector('#paperDrawerPanel [main]').scrollToTop(true);

    app.generateClass = (value) => value.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
    app.getIndexByProperty = (array, property, value) => {
        for (let i = 0, length = array.length; i < length; i++) {
            if (array[i][property] == value) {
                return i;
            }
        }
    };
    app.randomOrder = (array) => array.sort(function () { return 0.5 - Math.random();});
})(document);
