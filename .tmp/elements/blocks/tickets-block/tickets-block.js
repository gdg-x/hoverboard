'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
    'use strict';

    var TicketsBlock = function () {
        function TicketsBlock() {
            _classCallCheck(this, TicketsBlock);
        }

        _createClass(TicketsBlock, [{
            key: 'beforeRegister',
            value: function beforeRegister() {
                this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
            }
        }, {
            key: 'openTicketsDialog',
            value: function openTicketsDialog() {
                this.fire('iron-signal', {
                    name: 'track-event',
                    data: {
                        category: 'button',
                        action: 'click',
                        label: 'group',
                        value: 'buy-a-ticket'
                    }
                });
                this.$.ticketsDialog.open();
            }
        }]);

        return TicketsBlock;
    }();

    Polymer(TicketsBlock);
})();