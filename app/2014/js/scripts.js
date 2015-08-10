(function($) {
    $(document).ready(function() {
        $(window).load(function() {
            $('#st-container').removeClass('disable-scrolling');
            $('#loading-animation').fadeOut();
            $('#preloader').delay(350).fadeOut(800);
            equalheight('.same-height');
        });

        if ($(window).width() > 1500) {
            $('.effect-wrapper').addClass('col-lg-3');
        }
        if ($(window).width() < 768) {
            $('.animated').removeClass('animated').removeClass('hiding');
            $('.stat span').removeClass('timer');
            $('.timeslot-label').addClass('stick-label');
        }
        if ($(window).height() < 512) {
            $('#bottom-navlinks').removeClass('bottom-navlinks').addClass('bottom-navlinks-small');
        }
        if ($(window).scrollTop() >= 100) {
            $('#top-header').addClass('after-scroll');
            $('#logo-header .logo').removeClass('logo-light').addClass('logo-dark');
        }

        $(window).scroll(function() {
            var scroll = $(this).scrollTop();
            var header = $('#top-header');
            var logo = $('#logo-header .logo');
            var buyButton = $('.right-nav-button');
            var topOffset = header.height() + $('.track-header').height();

            if (scroll >= 100) {
                header.addClass('after-scroll');
                logo.removeClass('logo-light').addClass('logo-dark');
            } else {
                header.removeClass('after-scroll');
                logo.removeClass('logo-dark').addClass('logo-light');
            }

            if (scroll >= $('.top-section').height()) {
                buyButton.removeClass('right-nav-button-hidden');
            } else {
                buyButton.addClass('right-nav-button-hidden');
            }

            $('.slot-element').each(function() {
                var currentPosition = $(this).offset().top - scroll;
                var offsetActivator = topOffset + $(this).find('.slot-title').height();
                if (currentPosition <= offsetActivator && currentPosition >= 0) {
                    var data = $(this).parent().data('slotDetail');
                    $('.track-header.sticky').find('.slot-detail').html(data);
                }
            });
        });

        $(window).resize(function() {
            if ($(window).width() > 1500) {
                $('.effect-wrapper').addClass('col-lg-3');
            } else {
                $('.effect-wrapper').removeClass('col-lg-3');
            }
            if ($(window).width() < 768) {
                $('.same-height').css('height', '100%');
                $('.timeslot-label').addClass('stick-label');
            } else {
                $('.timeslot-label').removeClass('stick-label');
                if (container.hasClass('st-menu-open')) {
                    container.removeClass('st-menu-open');
                    $('body').css('overflow', 'auto');
                }
                equalheight('.same-height');
            }
            if ($(window).height() < 512) {
                $('.st-menu').addClass('scrollable');
                $('#bottom-navlinks').removeClass('bottom-navlinks').addClass('bottom-navlinks-small');
            } else {
                $('.st-menu').removeClass('scrollable');
                $('#bottom-navlinks').removeClass('bottom-navlinks-small').addClass('bottom-navlinks');
            }
        });

        var scrollStatus = 1;
        // $(document).on('touchmove', function(e) {
        //     if (scrollStatus == 0) {
        //         e.preventDefault();
        //     } else {
        //         return true;
        //     }
        // });
        // $('body').on('touchmove', '.scrollable', function(e) {
        //     e.stopPropagation();
        // });

        function toogleScrolling() {
            if (scrollStatus == 0) {
                $('body').removeClass('disable-scrolling');
                scrollStatus = 1;
            } else {
                $('body').addClass('disable-scrolling');
                scrollStatus = 0;
            }
        }

        $(function() {
            $('a[href*=#]:not([href=#])').click(function() {
                if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
                    var target = $(this.hash);
                    target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                    if (target.length) {
                        $('html,body').animate({
                            scrollTop: target.offset().top
                        }, 1000);
                        return false;
                    }
                }
            });
        });
        $(function() {
            $('a[href=#]').click(function() {
                event.preventDefault();
            });
        });
        $(function() {
            if(window.location.href.indexOf("schedule") > -1 && window.location.hash) {
                var hash = window.location.hash;
                $(hash).click();
            } 
        });

        $(function() {
            var appear, delay, i, offset, _i, _len, _ref;
            _ref = $(".appear-animation");
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                i = _ref[_i];
                offset = i.offsetLeft + i.offsetTop;
                delay = offset / 1000;
                $(i).css('transition-delay', '' + (delay * 0.47) + 's');
                $(i).css('transition-duration', '' + 0.2 + 's');
            }
        });
        $('.appear-animation-trigger').appear(function() {
            setTimeout(function() {
                $('.appear-animation-trigger').parent('div').find('.appear-animation').addClass('visible');
            }, 1000);
        });

        $('.animated').appear(function() {
            var element = $(this);
            var animation = element.data('animation');
            var animationDelay = element.data('delay');
            if (animationDelay) {
                setTimeout(function() {
                    element.addClass(animation + " visible");
                    element.removeClass('hiding');
                    if (element.hasClass('counter')) {
                        element.find('.timer').countTo();
                    }
                }, animationDelay);
            } else {
                element.addClass(animation + " visible");
                element.removeClass('hiding');
                if (element.hasClass('counter')) {
                    element.find('.timer').countTo();
                }
            }
        }, {
            accY: -150
        });

        equalheight = function(container) {
            var currentTallest = 0,
                currentRowStart = 0,
                rowDivs = new Array(),
                $el,
                topPosition = 0;
            $(container).each(function() {
                $el = $(this);
                $($el).height('auto')
                topPostion = $el.position().top;
                if (currentRowStart != topPostion) {
                    for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
                        rowDivs[currentDiv].height(currentTallest);
                    }
                    rowDivs.length = 0; // empty the array
                    currentRowStart = topPostion;
                    currentTallest = $el.height();
                    rowDivs.push($el);
                } else {
                    rowDivs.push($el);
                    currentTallest = (currentTallest < $el.height()) ? ($el.height()) : (currentTallest);
                }
                for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
                    rowDivs[currentDiv].height(currentTallest);
                }
            });
        }


        //Side menu
        var container = $('.st-container');
        $('#menu-trigger').click(function(event) {
            event.stopPropagation();
            var effect = $(this).attr('data-effect');
            if (!container.hasClass('st-menu-open')) {
                container.addClass(effect).delay(25).addClass('st-menu-open');
                toogleScrolling();
            } else {
                container.removeClass('st-menu-open');
                toogleScrolling();
            }
        });
        $('.st-pusher').click(function() {
            if (container.hasClass('st-menu-open')) {
                container.removeClass('st-menu-open');
                toogleScrolling();
            }
        });

        $('.track-header').each(function() {
            var slot = $(this).closest('.schedule-table').find('.slot').first();
            var scheduleFirstSlotText;
            while (scheduleFirstSlotText === undefined) {
                scheduleFirstSlotText = slot.data('slotDetail');
                slot = slot.next();
            }
            $(this).find('.slot-detail').html(scheduleFirstSlotText);
        });

        $('#post-section .post-body p').each(function() {
            if ($(this).find('.feature-image').length) {
                var url = $(this).find('.feature-image').prop('src');
                $('#top-section').css('background-image', 'url(' + url + ')').addClass('enable-overlay');
            }
        });

        $('.slider').each(function() {
            $(this).find('.slider-item').first().addClass('slider-current-item').removeClass('hidden');
            if ($(this).find('.slider-item').length > 1) {
                $(this).closest('.speaker-item').find('.slider-next-item').removeClass('hidden');
            }
        });
        $('.slider-next-item').click(function() {
            var slider = $(this).closest('div');
            var elem = slider.find('.slider-current-item').next();
            if (elem.length) {
                elem.addClass('slider-current-item').removeClass('hidden');
                slider.find('.slider-current-item').first().removeClass('slider-current-item').addClass('hidden');
            } else {
                slider.find('.slider-item').first().addClass('slider-current-item').removeClass('hidden');
                slider.find('.slider-current-item').last().removeClass('slider-current-item').addClass('hidden');
            }
        });

        $('.404').each(function() {
            $(this).parent().addClass('hidden-xs blank-col');
        });
        $('.service-label').each(function() {
            var data = $(this).data('slotDetail');
            $(this).parent().attr('data-slot-detail', data).addClass('service-slot');
        });
        $('.timeslot-elements').each(function() {
            var elementsCount = $(this).children().length;
            if ($(this).find('> div.blank-col').length == elementsCount) {
                $(this).parent().addClass('hidden-xs');
            }
        });
        $('.modal').on('hidden.bs.modal', function () {
            var iframe = $(this).find('iframe');
            iframe.attr('src', iframe.attr('src'));
        });


        if (typeof twitterFeedUrl !== 'undefined') {
            $.getJSON(twitterFeedUrl, function(data) {
                $.each(data, function(i, gist) {
                    var tweetElement = '<div class="tweet animated fadeInUp hidden"><p class="tweet-text">' + linkify(gist.text) + '</p><p class="tweet-meta">by <a href="https://twitter.com/' + gist.user.screen_name + '" target="_blank">@' + gist.user.screen_name + '</a></p></div>';
                    $('#tweets').append(tweetElement);
                });
                animateTweets();
            });

            function linkify(inputText) {
                var replacedText, links1, links2, hashtags, profileLinks;
                links1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
                replacedText = inputText.replace(links1, '<a href="$1" target="_blank">$1</a>');
                links2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
                replacedText = replacedText.replace(links2, '$1<a href="http://$2" target="_blank">$2</a>');
                hashtags = /#(\S*)/g;
                replacedText = replacedText.replace(hashtags, '<a href="https://twitter.com/search?q=%23$1" target="_blank">#$1</a>');
                profileLinks = /\B@([\w-]+)/gm;
                replacedText = replacedText.replace(profileLinks, '<a href="https://twitter.com/$1" target="_blank">@$1</a>');
                return replacedText;
            }

            function animateTweets() {
                var $tweets = $('#tweets').find('.tweet'),
                    i = 0;
                $($tweets.get(0)).removeClass('hidden');

                function changeTweets() {
                    var next = (++i % $tweets.length);
                    $($tweets.get(next - 1)).addClass('hidden');
                    $($tweets.get(next)).removeClass('hidden');
                }
                var interval = setInterval(changeTweets, 5000);
            }
        }
    });

    // Google maps static
    if (typeof staticGoogleMaps !== 'undefined') {
        if (typeof workshopPlace !== 'undefined') {
            $('#canvas-map').addClass('image-section').css('background-image', 'url(http://maps.googleapis.com/maps/api/staticmap?zoom=16&center=' + mobileCenterMapCoordinates + '&size=' + $(window).width() + 'x700&scale=2&language=en&markers=' + eventPlaceCoordinates + '&markers=' + workshopPlace + '&maptype=roadmap&style=visibility:on|lightness:40|gamma:1.1|weight:0.9&style=element:labels|visibility:off&style=feature:water|hue:0x0066ff&style=feature:road|visibility:on&style=feature:road|element:labels|saturation:-30)');   
        } else {
            $('#canvas-map').addClass('image-section').css('background-image', 'url(http://maps.googleapis.com/maps/api/staticmap?zoom=17&center=' + mobileCenterMapCoordinates + '&size=' + $(window).width() + 'x700&scale=2&language=en&markers=' + eventPlaceCoordinates + '&maptype=roadmap&style=visibility:on|lightness:40|gamma:1.1|weight:0.9&style=element:labels|visibility:off&style=feature:water|hue:0x0066ff&style=feature:road|visibility:on&style=feature:road|element:labels|saturation:-30)');           
        }
    }

    //Google maps
    if (typeof googleMaps !== 'undefined') {
        var map, autocomplete, directionsDisplay, geocoder, polyline, origin;
        var markers = [];
        var directionsService = new google.maps.DirectionsService();
        var MY_MAPTYPE_ID = 'custom_style';

        function initialize() {
            directionsDisplay = new google.maps.DirectionsRenderer({
                suppressMarkers: true
            });
            geocoder = new google.maps.Geocoder();

            polyline = new google.maps.Polyline({
                strokeColor: '#03a9f4',
                strokeOpacity: 1,
                strokeWeight: 2
            });

            var defaultOpts = [{
                stylers: [{
                    lightness: 40
                }, {
                    visibility: 'on'
                }, {
                    gamma: 0.9
                }, {
                    weight: 0.4
                }]
            }, {
                elementType: 'labels',
                stylers: [{
                    visibility: 'on'
                }]
            }, {
                featureType: 'water',
                stylers: [{
                    color: '#5dc7ff'
                }]
            }, {
                featureType: 'road',
                stylers: [{
                    visibility: 'off'
                }]
            }];

            var zoomedOpts = [{
                stylers: [{
                    lightness: 40
                }, {
                    visibility: 'on'
                }, {
                    gamma: 1.1
                }, {
                    weight: 0.9
                }]
            }, {
                elementType: 'labels',
                stylers: [{
                    visibility: 'off'
                }]
            }, {
                featureType: 'water',
                stylers: [{
                    color: '#5dc7ff'
                }]
            }, {
                featureType: 'road',
                stylers: [{
                    visibility: 'on'
                }]
            }, {
                featureType: 'road',
                elementType: "labels",
                stylers: [{
                    saturation: -30
                }]
            }];

            var mapOptions = {
                zoom: 17,
                minZoom: 2,
                scrollwheel: false,
                panControl: false,
                draggable: true,
                zoomControl: false,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP
                },
                scaleControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                center: centerMap,
                mapTypeControlOptions: {
                    mapTypeIds: [google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID]
                },
                mapTypeId: MY_MAPTYPE_ID
            };
            if ($(window).width() < 768) {
                mapOptions.center = mobileCenterMap;
            }
            if (googleMaps == 'logistics') {
                mapOptions.zoom = 5;
                mapOptions.zoomControl = true;
            } else if (typeof workshopPlace !== 'undefined') {
                mapOptions.zoom = 16;
            }

            map = new google.maps.Map(document.getElementById('canvas-map'), mapOptions);
            var marker = new google.maps.Marker({
                position: eventPlace,
                animation: google.maps.Animation.DROP,
                icon: icon,
                map: map
            });
            if (typeof workshopPlace !== 'undefined') {
                var workshopMarker = new google.maps.Marker({
                    position: workshopPlace,
                    animation: google.maps.Animation.DROP,
                    icon: icon,
                    map: map
                });

                var infowindowHackathon = new google.maps.InfoWindow({
                    content: '<p><b>Hackathon</b> in ComeIn</p>'
                });
                var infowindowWorkshops = new google.maps.InfoWindow({
                    content: '<p><b>Workshops</b> in coMMuna</p>'
                });
                infowindowHackathon.open(map, marker);
                infowindowWorkshops.open(map, workshopMarker);
                google.maps.event.addListener(marker, 'click', function() {
                    infowindowHackathon.open(map, marker);
                });
                google.maps.event.addListener(workshopMarker, 'click', function() {
                    infowindowWorkshops.open(map, workshopMarker);
                });
                markers.push(workshopMarker);
            }
            markers.push(marker);
            var defaultMapOptions = {
                name: 'Default Style'
            };
            var zoomedMapOptions = {
                name: 'Zoomed Style'
            };
            var defaultMapType = new google.maps.StyledMapType(defaultOpts, defaultMapOptions);
            var zoomedMapType = new google.maps.StyledMapType(zoomedOpts, zoomedMapOptions);
            map.mapTypes.set('default', defaultMapType);
            map.mapTypes.set('zoomed', zoomedMapType);
            if (googleMaps === 'logistics') {
                map.setMapTypeId('default');
                var input = (document.getElementById('location-input'));
                autocomplete = new google.maps.places.Autocomplete(input);
                google.maps.event.addListener(autocomplete, 'place_changed', function() {
                    marker.setVisible(false);
                    var place = autocomplete.getPlace();
                    if (place.geometry == 'undefined' || !place.geometry) {
                        return;
                    }
                    var address = '';
                    if (place.address_components) {
                        address = [
                            (place.address_components[0] && place.address_components[0].short_name || ''), (place.address_components[1] && place.address_components[1].short_name || ''), (place.address_components[2] && place.address_components[2].short_name || '')
                        ].join(' ');
                    }
                    geocoder.geocode({
                        'address': address
                    }, function(results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            origin = results[0].geometry.location;
                            calcRoute(origin, 'TRANSIT');
                        } else {
                            alert('Geocode was not successful for the following reason: ' + status);
                        }
                    });
                });

            } else {
                map.setMapTypeId('zoomed');
            }

            function calcRoute(origin, selectedMode) {
                var request = {
                    origin: origin,
                    destination: eventPlace,
                    travelMode: google.maps.TravelMode[selectedMode]
                };
                directionsService.route(request, function(response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        map.setMapTypeId('zoomed');
                        directionsDisplay.setMap(map);
                        directionsDisplay.setDirections(response);
                        var leg = response.routes[0].legs[0];
                        makeMarker(leg.start_location);
                        makeMarker(leg.end_location);
                        $('#distance').text(leg.distance.text);
                        $('#estimateTime').text(leg.duration.text);
                        $('#mode-select').val(selectedMode);
                        $('#mode').removeClass('hidden');
                        var attribute = $('#mode-icon use').attr('xlink:href');
                        attribute = attribute.substring(0, attribute.indexOf('#') + 1) + 'icon-' + selectedMode.toLowerCase();
                        $('#mode-icon use').attr('xlink:href', attribute);
                    } else if (status != google.maps.DirectionsStatus.OK && selectedMode != 'DRIVING') {
                        calcRoute(origin, 'DRIVING');
                    } else {
                        var path = polyline.getPath();
                        path.push(origin);
                        path.push(eventPlace);
                        makeMarker(origin);
                        makeMarker(eventPlace);
                        var bounds = new google.maps.LatLngBounds();
                        bounds.extend(origin);
                        bounds.extend(eventPlace);
                        map.fitBounds(bounds);
                        polyline.setMap(map);
                        var distance = Math.round(google.maps.geometry.spherical.computeDistanceBetween(origin, eventPlace) / 1000);
                        $('#distance').text(distance + ' km');
                        $('#estimateTime').text('');
                        $('#find-flight').removeClass('hidden');
                        $('#mode').addClass('hidden');
                    }
                });
                deleteMarkers();
                $('#find-way').addClass('location-active');
                setDirectionInput(origin);
                $('#find-way h3').removeClass('fadeInUp').addClass('fadeOutDown');
            }

            function makeMarker(position) {
                var directionMarker = new google.maps.Marker({
                    position: position,
                    map: map,
                    icon: icon
                });
                markers.push(directionMarker);
            }

            function addMarker(location) {
                var marker = new google.maps.Marker({
                    position: location,
                    map: map
                });
                markers.push(marker);
            }

            function deleteMarkers() {
                for (var i = 0; i < markers.length; i++) {
                    markers[i].setMap(null);
                }
                markers = [];
            }

            function smoothZoom(level) {
                var currentZoom = map.getZoom(),
                    timeStep = 50;
                var numOfSteps = Math.abs(level - currentZoom);
                var step = (level > currentZoom) ? 1 : -1;
                for (var i = 0; i < numOfSteps; i++) {
                    setTimeout(function() {
                        currentZoom += step;
                        map.setZoom(currentZoom);
                    }, (i + 1) * timeStep);
                }
            }

            function setDirectionInput(origin) {
                geocoder.geocode({
                    'latLng': origin
                }, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK && results[1]) {
                        var arrAddress = results[1].address_components;
                        $.each(arrAddress, function(i, address_component) {
                            if (address_component.types[0] == "locality") {
                                $('#result-name').text(address_component.long_name);
                                return false;
                            }
                        });
                    }
                });
            }

            $('#mode-select').change(function() {
                var selectedMode = $(this).val();
                calcRoute(origin, selectedMode);
            });


            $("#direction-locate").click(function() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        origin = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        calcRoute(origin, 'TRANSIT');
                    });
                }
            });

            $("#direction-cancel").click(function() {
                $('#find-way').removeClass('location-active');
                $('#location-input').val('');
                $("#find-flight").addClass('hidden');
                deleteMarkers();
                directionsDisplay.setMap(null);
                polyline.setMap(null);
                map.setMapTypeId('default');
                map.panTo(eventPlace);
                if ($(window).width() < 768) {
                    map.setCenter(mobileCenterMap);
                } else {
                    map.setCenter(centerMap);
                }
                makeMarker(eventPlace);
                smoothZoom(5);
                $('#find-way h3').removeClass('fadeOutDown').addClass('fadeInUp');
            });
        }

        google.maps.event.addDomListener(window, 'load', initialize);
    }

})(jQuery);
