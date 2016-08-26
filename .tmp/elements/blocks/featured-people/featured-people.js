'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var FeaturedPeople = function () {
    function FeaturedPeople() {
      _classCallCheck(this, FeaturedPeople);
    }

    _createClass(FeaturedPeople, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          people: {
            type: Array,
            observer: '_peopleChanged'
          }
        };
      }
    }, {
      key: '_peopleChanged',
      value: function _peopleChanged() {
        var people = this._toArray(this.people),
            filteredPeople = [];
        for (var i = 0; i < people.length; i++) {
          if (people[i].featured) {
            filteredPeople.push(people[i]);
          }
        }
        this.featuredPeople = this._randomOrder(filteredPeople).slice(0, 4);
      }
    }, {
      key: 'behaviors',
      get: function get() {
        return [Polymer.UtilsBehavior];
      }
    }]);

    return FeaturedPeople;
  }();

  Polymer(FeaturedPeople);
})();