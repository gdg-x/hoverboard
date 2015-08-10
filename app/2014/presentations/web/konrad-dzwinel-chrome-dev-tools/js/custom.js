(function () {
  "use strict";

  var listOfTasks = {
    html: $('#front-end-tasks').html(),
    text: $('#front-end-tasks').text()
  };
  $('.front-end-tasks').html(listOfTasks.html);

  $('#day-in-life').on('slideenter', function() {
    var $p = $(this).find('article p');
    $p.text('');

    (listOfTasks.text).split(',').forEach(function(item, idx, arr) {
      if(idx < arr.length - 1) {
        item += ',';
      }

      var span = $('<span>').text(item);
      span.css({
        transitionDuration: Math.abs((Math.random() * 600) + 300) + "ms",
        transitionDelay: Math.abs((Math.random() * 3000) + 600) + "ms"
      });
      $p.append(span);
    });

    setTimeout(function() {
      $p.addClass('active');
    }, 500);

    //$.typer.options.typeSpeed = 5;
    //$p.typeTo(listOfTasks.text);
  }).on('slideleave', function() {
    var $p = $(this).find('article p');
    $p.removeClass('active');
  });

  $('.add-class').on('slideenter', function() {
    $(this).addClass($(this).data('class'));
  }).on('slideleave', function() {
    $(this).removeClass($(this).data('class'));
  })

})();