'use strict';

(function () {
  'use strict';

  Polymer.ShareBehavior = {

    properties: {
      shareMenuSelector: {
        type: String,
        value: '[share-menu]'
      }
    },

    share: function share(e) {
      var type = e.currentTarget.getAttribute('share');
      var url = null;
      var shareUrl = location.href;
      var width = 600;
      var height = 600;
      var winOptions = 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=' + height + ',width=' + width;

      var title = document.title;

      switch (type) {
        case 'facebook':
          height = 229;
          url = 'https://www.facebook.com/sharer.php?u=' + encodeURIComponent(shareUrl) + '&t=' + encodeURIComponent(title);
          window.open(url, 'share', winOptions);
          break;

        case 'gplus':
          height = 348;
          width = 512;
          url = 'https://plus.google.com/share?url=' + encodeURIComponent(shareUrl) + '&hl=' + encodeURIComponent(document.documentElement.lang);
          window.open(url, 'share', winOptions);
          break;

        case 'twitter':
          height = 253;
          var text = 'Check out ' + title + ' at dfua: ' + shareUrl;
          url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
          window.open(url, 'share', winOptions);
          break;

        case 'copy':
          var copyElement = document.createElement('input');
          copyElement.setAttribute('type', 'text');
          copyElement.setAttribute('value', shareUrl);
          copyElement = document.body.appendChild(copyElement);
          copyElement.select();
          document.execCommand('copy');
          copyElement.remove();
          break;

        default:
          return;
      }
      Polymer.dom(this.root).querySelector(this.shareMenuSelector).close();
    }

  };
})();