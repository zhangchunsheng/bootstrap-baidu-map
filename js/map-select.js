;(function($) {

    var defaults = {
        center_lat: 39.914515484866,
        center_lng: 116.40431911725,
        zoom: 12,
        title: "设置坐标点",
        need_control: 1,
        readonly: 0,
        lat: 39.914515484866,
        lng: 116.40431911725,
        city_name: "北京",
        input_city_name: ""
    };

    var selectModalMap = new BMap.Map("select-modal-map", {enableMapClick: false});
    selectModalMap.centerAndZoom(new BMap.Point(defaults.center_lng, defaults.center_lat), defaults.zoom);

    //selectModalMap.enableScrollWheelZoom();
    //selectModalMap.enableInertialDragging();
    //selectModalMap.enableContinuousZoom();

    var size = new BMap.Size(10, 20);
    selectModalMap.addControl(new BMap.CityListControl({
        anchor: BMAP_ANCHOR_TOP_LEFT,
        offset: size,
        // 切换城市之间事件
        onChangeBefore: function() {
            // alert('before');
        },
        // 切换城市之后事件
        onChangeAfter:function() {
            // alert('after');
        }
    }));

    var marker = null;
    function addMarker(point, canDrag) { //添加标识
        if(marker) {
            // selectModalMap.removeOverlay(marker); //清除标识
            marker.setPosition(point);
        } else {
            marker = new BMap.Marker(point);
            if(canDrag) {
                if($(".map-marker-drag").length > 0 && $(".map-marker-drag")[0].checked) {
                    marker.enableDragging();
                } else {
                    marker.disableDragging();
                }
            }
            selectModalMap.addOverlay(marker);
        }
    }
    function picker(e) {
        addMarker(e.point, true);
        selectModalMap.panTo(e.point);
    }
    function searchPoi(location, address, callback) {
        if(typeof location === "string") {
            location = location != "西双版纳" ? location : "西双版纳傣族自治州";

            if(location == '') {
                alert("请选择城市以检索");
                return;
            }
        }

        var search = new BMap.LocalSearch(location, {
            onSearchComplete: function(result) {
                if (result != null) {
                    var list = [];
                    for (var i = 0, len = result.getCurrentNumPois(); i < len; i++) {
                        var poi = result.getPoi(i);
                        if (poi.type == BMAP_POI_TYPE_BUSSTOP) {
                            poi.address = poi.title
                        }
                        poi.name = poi.title;
                        poi.lat = poi.point.lat;
                        poi.lng = poi.point.lng;
                        list.push(poi)
                    }
                    callback(list)
                }
            },
            pageCapacity: 20
        });
        search.search(address)
    }
    var target = null;
    var hasControl = 0;

    $.fn.extend({
        mapSelect: function (options) {
            var modal = $('#div-map-select').modal({show: false});

            var selecter = {};
            selecter.settings = $.extend({}, defaults, options);

            modal.find('.modal-title').text(selecter.settings.title);

            if(selecter.settings.need_control == 1 && hasControl == 0) {
                var topRightControl = new BMap.ScaleControl({anchor: BMAP_ANCHOR_TOP_RIGHT});// 右上角，添加比例尺
                var topRightNavigation = new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_RIGHT});  //右上角，添加默认缩放平移控件
                selectModalMap.addControl(topRightControl);
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

                        var cityName = "";
                        if(selecter.settings.input_city_name != "") {
                            var inputCityName = $("input[name='" + selecter.settings.input_city_name  + "']");
                            if(inputCityName.length > 0) {
                                cityName = inputCityName.val();
                            }
                            if(cityName == "") {
                                cityName = selecter.settings.city_name;
                            }
                        } else {
                            cityName = selecter.settings.city_name;
                        }

                        var checkHtml = $(".map-header").html();
                        if(checkHtml == "") {
                            selectModalMap.addEventListener("click", picker);

                            var html = $("#map_select_template").html();
                            $(".map-header").html(_.template(html)({}));

                            //$(".map-city").val(cityName);
                            $(".map-city").bsSuggest('init', {
                                clearable: true,
                                url: "https://api.map.baidu.com/shangquan/forward/?qt=sub_area_list&ext=1&level=2&areacode=1&business_flag=0",
                                jsonp: "callback",
                                idField: "area_code",
                                keyField: "area_name",
                                effectiveFields: ["area_code", "area_name"],
                                searchFields: ["area_code", "area_name"],
                                effectiveFieldsAlias: {area_code: "地区编码", cn: "城市名称"},
                                ignorecase: true,
                                fnProcessData: function(result) {
                                    var value = [];
                                    var result = result.content.sub;
                                    var subData = [];
                                    for(var i in result) {
                                        if(result[i].area_type == 2) {
                                            value.push({
                                                area_code: result[i].area_code,
                                                area_name: result[i].area_name
                                            });
                                        } else {
                                            subData = result[i].sub;
                                            for(var j in subData) {
                                                value.push({
                                                    area_code: subData[j].area_code,
                                                    area_name: subData[j].area_name
                                                });
                                            }
                                        }
                                    }
                                    return {value: value};
                                }
                            }).on('onDataRequestSuccess', function (e, result) {
                                console.log('onDataRequestSuccess: ', result);
                            }).on('onSetSelectValue', function (e, keyword, data) {
                                console.log('onSetSelectValue: ', keyword, data);
                            }).on('onUnsetSelectValue', function () {
                                console.log('onUnsetSelectValue');
                            });

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
                            $(".map-address-search").bind("click", function(e) {
                                var cityName = $(".map-city").val();
                                var address = $(".map-address").val();
                                var location = cityName;
                                if($(".map-search-type").length > 0 && $(".map-search-type")[0].checked) {
                                    location = selectModalMap;
                                }
                                searchPoi(location, address, function(data) {
                                    if (data == undefined) {
                                        alert("没有查到数据");
                                    } else {
                                        var html = [];
                                        for (var i = 0; i < data.length; i++) {
                                            html.push('<li><a href="javascript:;" style="color_: red !important;" data-lnglat="' + data[i].lng + "," + data[i].lat + '">' + data[i].name + "</a><br>地址：<span>" + data[i].address + "</span></li>")
                                        }
                                        $(".map-address-list").html(html.join(""));

                                        $('div.map-address-list a').bind('click', function (e) {
                                            var lnglat = $(this).attr('data-lnglat').split(",");
                                            var point = new BMap.Point(lnglat[0], lnglat[1]);
                                            addMarker(point);
                                            selectModalMap.panTo(point);
                                        });
                                    }
                                });
                            });

                            $(".map-marker-drag").bind("change", function(e) {
                                if(this.checked) {
                                    if(marker) {
                                        marker.enableDragging();
                                    }
                                } else {
                                    if(marker) {
                                        marker.disableDragging();
                                    }
                                }
                            });
                        } else {
                            //$(".map-city").val(cityName);
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