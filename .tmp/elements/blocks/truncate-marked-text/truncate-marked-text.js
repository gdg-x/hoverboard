'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
    'use strict';

    var TruncateMarkedText = function () {
        function TruncateMarkedText() {
            _classCallCheck(this, TruncateMarkedText);
        }

        _createClass(TruncateMarkedText, [{
            key: 'beforeRegister',
            value: function beforeRegister() {
                this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
                this.properties = {
                    characters: Number,
                    words: Number,
                    breakLastWord: {
                        type: Boolean,
                        value: false
                    },
                    text: {
                        type: String,
                        observer: 'truncate'
                    },
                    _outputText: {
                        type: String,
                        notify: true
                    }
                };
            }
        }, {
            key: 'truncate',
            value: function truncate() {
                if (this.words && !this.characters) {
                    this._outputText = this._truncateByWords(this.text, this.words);
                } else {
                    this._outputText = this._truncateByCharacters(this.text, this.characters, this.breakLastWord);
                }
            }
        }, {
            key: '_truncateByWords',
            value: function _truncateByWords(input, words) {
                if (isNaN(words)) {
                    return input;
                }
                if (words <= 0) {
                    return '';
                }
                if (input) {
                    var inputWords = input.split(/\s+/);
                    if (inputWords.length > words) {
                        input = inputWords.slice(0, words).join(' ') + '...';
                    }
                }
                return input;
            }
        }, {
            key: '_truncateByCharacters',
            value: function _truncateByCharacters(input, chars, breakOnWord) {
                if (isNaN(chars)) {
                    return input;
                }
                if (chars <= 0) {
                    return '';
                }
                if (input && input.length > chars) {
                    input = input.trim().substring(0, chars);
                    if (!breakOnWord) {
                        var lastSpace = input.lastIndexOf(' ');
                        if (lastSpace !== -1) {
                            input = input.substr(0, lastSpace);
                        }
                    } else {
                        while (input.charAt(input.length - 1) === ' ') {
                            input = input.substr(0, input.length - 1);
                        }
                    }
                    return input + '...';
                }
                return input;
            }
        }]);

        return TruncateMarkedText;
    }();

    Polymer(TruncateMarkedText);
})();