'use strict';

(function () {
  'use strict';

  Polymer({

    is: 'post-page',

    behaviors: [Polymer.NeonAnimationRunnerBehavior, Polymer.NeonSharedElementAnimatableBehavior, Polymer.UtilsBehavior],

    properties: {
      postId: {
        type: String,
        notify: true
      },
      posts: Array,
      heroSettings: {
        type: Object,
        notify: true
      },
      selected: {
        type: Boolean,
        observer: 'updateHeroSettings'
      },
      _loaded: {
        type: Boolean,
        value: false
      },
      _post: Object,
      _latestPosts: {
        type: Array,
        value: []
      },

      animationConfig: {
        type: Object,
        value: function value() {
          var cascaded = Polymer.dom(this.root).querySelectorAll('[cascaded]');
          var cascadedArray = Array.prototype.slice.call(cascaded);
          return {
            'entry': [{
              name: 'fade-in-animation',
              animation: 'fade-in-animation',
              node: this,
              timing: {
                delay: 500
              }
            }],
            'exit': [{
              name: 'cascaded-animation',
              animation: 'transform-animation',
              transformTo: 'translate3d(0, 100%, 0)',
              nodes: cascadedArray
            }, {
              name: 'fade-out-animation',
              animation: 'fade-out-animation',
              node: this
            }],
            'postLoaded': [{
              name: 'cascaded-animation',
              animation: 'transform-animation',
              transformFrom: 'translate3d(0, 100%, 0)',
              nodes: cascadedArray,
              timing: {
                delay: 500
              }
            }, {
              name: 'fade-in-animation',
              animation: 'fade-in-animation',
              nodes: cascadedArray,
              timing: {
                delay: 500
              }
            }, {
              name: 'scale-down-animation',
              animation: 'scale-down-animation',
              node: this.$.spinner
            }]
          };
        }
      }
    },

    observers: ['_postChanged(posts, postId, selected)'],

    listeners: {
      'neon-animation-finish': '_onNeonAnimationFinish'
    },

    updateHeroSettings: function updateHeroSettings() {
      if (this._post) {
        this.heroSettings = {
          backgroundColor: this._post.primaryColor,
          backgroundImage: this._post.image,
          fontColor: '#FFFFFF',
          tabBarColor: '#FFFFFF'
        };
      }
    },

    _postChanged: function _postChanged() {
      if (this.selected && this.postId) {
        this.$.animationWrapper.style.opacity = 0;
        this.$.animationWrapper.style.display = 'none';
        this.$.spinner.style.opacity = 1;

        var postIndex = this._getIndexByProperty(this.posts, 'id', this.postId);

        this._latestPosts[0] = postIndex > 0 ? this.posts[postIndex - 1] : null;
        this._latestPosts[1] = postIndex < this.posts.length - 1 ? this.posts[postIndex + 1] : null;
        this.notifyPath('_latestPosts', this._latestPosts.slice());

        this._post = this.posts[postIndex];
        this.notifyPath('_post.date', new Date(this._post.posted).toDateString().slice(4));
        this.updateHeroSettings();

        this._postUrl = '/posts/' + this._post.posted + '-' + this.postId + '.markdown';
        this.$.ajax.generateRequest();
      }
    },

    _postLoaded: function _postLoaded() {
      this._loaded = true;
      this.async(function () {
        this.$.animationWrapper.style.opacity = 1;
        this.$.animationWrapper.style.display = 'block';
      }, 100);
      this.playAnimation('postLoaded');
      this.$.disqus.reset();
      this.postId = null;
    },

    _onNeonAnimationFinish: function _onNeonAnimationFinish() {
      if (this._loaded) {
        this.$.spinner.style.opacity = 0;
      }
    }

  });
})();