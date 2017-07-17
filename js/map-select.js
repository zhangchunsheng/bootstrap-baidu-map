;(function($) {

    var defaults = {
        center_lat: 39.914515484866,
        center_lng: 116.40431911725,
        zoom: 12,
        title: "设置坐标点",
        need_control: 1,
        readonly: 0,
        lat: 39.914515484866,
        lng: 116.40431911725
    };

    var selectModalMap = new BMap.Map("select-modal-map");
    selectModalMap.centerAndZoom(new BMap.Point(defaults.center_lng, defaults.center_lat), defaults.zoom);

    var marker = null;
    function addMarker(point, canDrag) { //添加标识
        if(marker) {
            selectModalMap.removeOverlay(marker); //清除标识
        }
        marker = new BMap.Marker(point);
        if(canDrag) {
            //marker.enableDragging();
        }
        selectModalMap.addOverlay(marker);
    }
    function picker(e) {
        addMarker(e.point, true);
        selectModalMap.panTo(e.point);
    }
    var target = null;

    $.fn.extend({
        mapSelect: function (options) {
            var modal = $('#div-map-select').modal({show: false});

            var selecter = {};
            selecter.settings = $.extend({}, defaults, options);

            modal.find('.modal-title').text(selecter.settings.title);

            var hasControl = 0;
            if(selecter.settings.need_control == 1 && hasControl == 0) {
                var topLeftControl = new BMap.ScaleControl({anchor: BMAP_ANCHOR_TOP_LEFT});// 左上角，添加比例尺
                var topLeftNavigation = new BMap.NavigationControl();  //左上角，添加默认缩放平移控件
                var topRightNavigation = new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_RIGHT, type: BMAP_NAVIGATION_CONTROL_SMALL}); //右上角，仅包含平移和缩放按钮
                selectModalMap.addControl(topLeftControl);
                selectModalMap.addControl(topLeftNavigation);
                selectModalMap.addControl(topRightNavigation);
                hasControl = 1;
            }

            var callback = options.callback || function (lat, lng) {
                };

            var el = this;

            var that = $(this);

            var init = function() {
                that.bind("click", function(e) {
                    target = $(e.target);//e.currentTarget
                    var lat = target.data("lat");
                    var lng = target.data("lng");
                    if(lat == 0) {
                        lat = selecter.settings.center_lat;
                    }
                    if(lng == 0) {
                        lng = selecter.settings.center_lng;
                    }
                    modal.modal('show');
                    var point = new BMap.Point(lng, lat);
                    setTimeout(function() {
                        var modalPoint = new BMap.Point(lng - 0.22, lat + 0.1);// If you use modal fade, use need this for modal happy.
                        selectModalMap.panTo(point);
                    }, 100);

                    if(selecter.settings.readonly == 1) {
                        addMarker(point, false);

                        selectModalMap.removeEventListener("click", picker);
                        $(".map-header").html("");
                    } else {// has set button
                        addMarker(point, true);

                        var checkHtml = $(".map-header").html();
                        if(checkHtml == "") {
                            selectModalMap.addEventListener("click", picker);

                            var html = $("#map_select_template").html();
                            $(".map-header").html(_.template(html)({}));

                            $(".set-map-location").bind("click", function(e) {
                                if(marker) {
                                    var p = marker.getPosition();
                                    var lat = p.lat;
                                    var lng = p.lng;

                                    target.val("baidu:" + lng + "," + lat);
                                    target.data("lng", lng);
                                    target.data("lat", lat);

                                    callback(lat, lng);

                                    modal.modal('hide');
                                } else {
                                    alert("请先在地图上设置点");
                                }
                            });
                        }
                        modal.modal('show');
                    }
                });
                selecter.initialized = true;
            };

            el.setDefaultValue = function() {
                el.setValue(selecter.settings.center_lat, selecter.settings.center_lng);
            };

            el.setValue = function(lat, lng) {
                that.val("baidu:" + lat + "," + lng);
                that.attr("data-lat", lat);
                that.attr("data-lng", lng);
            };

            el.rebind = function() {
                if(selecter.initialized) {
                    return;
                }

                init();
            };

            el.destroySelecter = function() {
                if(!selecter.initialized) {
                    return;
                }
                that.unbind("click");
                selecter.initialized = false;
            };

            init();

            return this;
        }
    });
})(jQuery);