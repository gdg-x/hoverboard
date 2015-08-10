;(function ( $, window, document, undefined ) {

  var pluginName = "jLayers",
    defaults = {
      activeView: 'side-view'
    };

  function Plugin ( element, options ) {
    this.$element = $(element);
    this.settings = $.extend( {}, defaults, options );

    if(this.$element.attr('data-activeView')) {
      this.settings['activeView'] = this.$element.attr('data-activeView');
    }

    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  Plugin.prototype = {
    init: function () {
      var self = this;

      this.$element.on('click', '> div:nth-child(1)', function() {
        self.$element.find('> div').removeClass('highlight');
        self.$element.toggleClass(self.settings.activeView);
      });

      this.$element.on('click', '> div:gt(0)', function() {
        if(self.$element.hasClass(self.settings.activeView)) {
          $(this).siblings().removeClass('highlight');
          $(this).toggleClass('highlight');
        }
      });
    },
    yourOtherFunction: function () {
      // some logic
    }
  };

  $.fn[ pluginName ] = function ( options ) {
    this.each(function() {
      if ( !$.data( this, "plugin_" + pluginName ) ) {
        $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
      }
    });

    return this;
  };

  jQuery('.jlayers').jLayers();

})( jQuery, window, document );
