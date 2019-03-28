/*
    @param {Object} options  配置信息(详见defaults默认值)
    @author: jianpingGao
    @data: 2019-03-20
*/

(function ($, window, document) {
    var defaults = {
        urlList: "demo.png",
        isShowResult: true,
        isShowPageBox: true,
        isShowBtn: true,
        width: 500,
        height: 300,
        callback: null,
        saveImg: null,
        selfPhotoBtn: null,
        selfCancelBtn: null
    }

    function GetImage($ele, options) {
        this.options = options = $.extend(defaults, options || {});
        this.$ele = $ele;
        this.eventName = {
            down: "mousedown",
            move: "mousemove",
            up: "mouseup",
            click: "click"
        };
        this.canvasConfig = {
            width: this.options.width,
            height: this.options.height,
            img: null,         //图片对象
            size: null,         //图片完整显示在canvas容器内的尺寸
            offset: {x: 0, y: 0}, //图片绘制偏移，为了原图不移出框外，这个只能是负值or 0
        }
        this.pickerConfig = {
            pickerSize: {x: 100, y: 100},
            x: this.canvasConfig.width / 2 - 100 / 2,
            y: this.canvasConfig.height / 2 - 100 / 2
        }
        this.init();
    }

    GetImage.prototype = {
        constructor: GetImage,
        init: function () {
            this.createDom();
            this.pageBox = $(".pageBox");
            this.picker = $("#picker");
            this.result = $(".result");
            this.loadImage();
            this.bindEvent();
        },
        createDom: function () {
            var self = this;

            var canvas = $("<canvas id='canvas_demo' width='" + self.canvasConfig.width + "' height='" + self.canvasConfig.height + "'>");

            var pickerDom = ' <div id="picker" style="display: none;">' +
                '<div class="resize left-top"></div>' +
                '<div class="resize left-bottom"></div>' +
                '<div class="resize right-top"></div>' +
                '<div class="resize right-bottom"></div>' +
                '<div class="cut-info">' +
                    '<a href="javascript:void(0)">拖动边框可调整截图范围</a>' +
                    '<div class="pic-btn pic-save"></div>' +
                    '<div class="pic-btn pic-cancel"></div>' +
                '</div>' +
                '</div>';

            var btnDom = '<div class="btn">' +
                '<a class="left pageBox">前一张图</a>' +
                '<input type="button" value="截图" style="background-color: #abcdef;color:#fff;" id="photo-btn-do">' +
                '<input type="button" value="取消截图" style="background-color: #f60;color:#fff;" id="photo-btn-cancel">' +
                '<a class="right pageBox">后一张图</a>' +
                '</div>';

            var resultDom = '<div class="result" style="display: none;">' +
                '<p>结果：</p>' +
                '<canvas id="result"></canvas>' +
                '</div>';

            if (!self.options.isShowResult) {
                var allDom = pickerDom + btnDom;
            } else {
                var allDom = pickerDom + btnDom + resultDom;
            }

            self.$ele.append(allDom);
            self.$ele.prepend(canvas);
        },

        bindEvent: function () {
            var self = this;
            var pickerConfig = self.pickerConfig;
            var canvasConfig = self.canvasConfig;
            var canvas = document.getElementById("canvas_demo");

            //绑定鼠标在选择工具上按下的事件
            $("#picker").on(self.eventName.down, function (e) {
                e.stopPropagation();
                var start = {
                    x: self.getClientXY(e).x,
                    y: self.getClientXY(e).y,
                    initX: pickerConfig.x,
                    initY: pickerConfig.y
                };
                self.$ele.on(self.eventName.move, function (e) {
                    // 将x、y限制在框内
                    pickerConfig.x = Math.min(Math.max(start.initX + self.getClientXY(e).x - start.x, 0), canvasConfig.width - pickerConfig.pickerSize.x);
                    pickerConfig.y = Math.min(Math.max(start.initY + self.getClientXY(e).y - start.y, 0), canvasConfig.height - pickerConfig.pickerSize.y);
                    self.setPicker();
                })
            });
            //改变选择框大小事件
            $(".resize").each(function (index, ele) {
                $(ele).on(self.eventName.down, function (e) {
                    e.stopPropagation();
                    var start = {
                        x: self.getClientXY(e).x,
                        y: self.getClientXY(e).y,
                        initX: pickerConfig.pickerSize.x,
                        initY: pickerConfig.pickerSize.y
                    };
                    self.$ele.on(self.eventName.move, function (e) {
                        // // 边界限定
                        if (e.clientX >= canvas.width) e.clientX = canvas.width;
                        if (e.clientY >= canvas.height) e.clientY = canvas.height;
                        if (e.clientX <= 0) e.clientX = 0;
                        if (e.clientY <= 0) e.clientY = 0;

                        // 鼠标变化量
                        var x_ = self.getClientXY(e).x - start.x;
                        var y_ = self.getClientXY(e).y - start.y;
                        switch (index) {
                            // 左上
                            case 0 :
                                pickerConfig.pickerSize.x = start.initX - x_;
                                pickerConfig.pickerSize.y = start.initY - y_;
                                pickerConfig.x = start.x + x_;
                                pickerConfig.y = start.y + y_;
                                break;
                            // 右上
                            case 1 :
                                pickerConfig.pickerSize.x = start.initX - x_;
                                pickerConfig.pickerSize.y = start.initY + y_;
                                pickerConfig.x = start.x + x_;
                                break;
                            // 右下
                            case 2 :
                                pickerConfig.pickerSize.x = start.initX + x_;
                                pickerConfig.pickerSize.y = start.initY - y_;
                                pickerConfig.y = start.y + y_;
                                break;
                            // 左下
                            case 3 :
                                pickerConfig.pickerSize.x = start.initX + x_;
                                pickerConfig.pickerSize.y = start.initY + y_;
                                break;
                        }
                        // 极值判断
                        pickerConfig.pickerSize.x = Math.max(pickerConfig.pickerSize.x, 10);
                        pickerConfig.pickerSize.y = Math.max(pickerConfig.pickerSize.y, 10);
                        pickerConfig.x = Math.min(pickerConfig.x, start.initX + start.x - 10);
                        pickerConfig.y = Math.min(pickerConfig.y, start.initY + start.y - 10);
                        self.setPicker();
                    })
                });
            });

            $(document).on(self.eventName.up, function () {
                self.$ele.unbind(self.eventName.move);
            });
            // esc取消截屏
            $(document).on(self.eventName.up, function (e) {
                if (e.keyCode == 27) $("#photo-btn-cancel").trigger("click"); // esc取消截屏
            });
            // 右键取消截屏
            $("#picker").on("contextmenu", function () {
                $("#photo-btn-cancel").trigger("click");
                return false;
            });
            // 截屏
            $("#photo-btn-do").on(self.eventName.click, function () {
                self.picker.show();
                self.result.show();
                self.setPicker();
            });
            // 取消截屏
            $("#photo-btn-cancel,.pic-cancel").on(self.eventName.click, function () {
                var canvas = document.getElementById("canvas_demo"),
                    context = canvas.getContext("2d");
                self.picker.hide();
                self.result.hide();
                self.loadImage();
                context.clearRect(0, 0, canvas.width, canvas.height);
            });

            $(self.options.selfPhotoBtn).on(self.eventName.click, function () {
                $("#photo-btn-do").trigger("click");
            });
            $(self.options.selfCancelBtn).on(self.eventName.click, function () {
                $("#photo-btn-cancel").trigger("click");
            });
            // 左右切换
            $(".btn .pageBox").on(self.eventName.click, function () {
                var length = self.options.urlList.length;
                var i = 0;
                if ($(this).hasClass("left")) {
                    i--;
                    if (i <= 0) i = 0;
                } else {
                    i++;
                    if (i >= length - 1) i = length - 1;
                }
                self.picker.hide();
                self.result.hide();
                self.clearImage();
                self.loadImage(i);
            });

            //保存截图
            $('.cut-info .pic-save').on(self.eventName.click, function (){
                if( !self.options.saveImg ) {
                    alert("暂不支持下载");
                    return;
                }
                var _canvas = document.createElement('canvas');
                _canvas.width = self.pickerConfig.pickerSize.x;
                _canvas.height = self.pickerConfig.pickerSize.y;
                var _context = _canvas.getContext("2d");
                _context.drawImage(canvas, self.pickerConfig.x, self.pickerConfig.y, self.pickerConfig.pickerSize.x, self.pickerConfig.pickerSize.y,0,0,self.pickerConfig.pickerSize.x, self.pickerConfig.pickerSize.y);
                var base64 = _canvas.toDataURL("image/png");
                base64 = base64.substr(base64.indexOf(',') + 1);
                self.options.saveImg(base64);
                $("#photo-btn-cancel").trigger("click");
            });

        },
        // 加载图片
        loadImage: function (index) {
            var self = this;
            var url;

            if ($.isArray(self.options.urlList)) {
                url = self.options.urlList[index] ? self.options.urlList[index] : self.options.urlList[0];
                if (!self.options.isShowPageBox)
                    self.pageBox.off().hide();
                else
                    self.pageBox.show();
            }
            if (typeof self.options.urlList == "string") {
                url = self.options.urlList;
                self.pageBox.off().hide();
            }

            if (!self.options.isShowBtn) {
                $(".btn input").hide();
            }

            var img = new Image(),
                canvas = document.getElementById("canvas_demo"),
                context = canvas.getContext("2d");
            img.src = url;
            img.onload = function () {
                self.canvasConfig.img = img;
                self.canvasConfig.size = self.getFixedSize(img, canvas);
                context.drawImage(img, 0, 0, img.width, img.height, self.canvasConfig.offset.x, self.canvasConfig.offset.y, self.canvasConfig.size.width, self.canvasConfig.size.height);
            }
        },
        // 清空画布
        clearImage: function () {
            var canvas = document.getElementById("canvas_demo"),
                context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
        },
        // 根据图片和canvas的尺寸，确定图片显示在canvas中的尺寸
        getFixedSize: function (img, canvas) {
            var cancasRate = canvas.width / canvas.height,
                imgRate = img.width / img.height,
                width = img.width,
                height = img.height;
            if (cancasRate >= imgRate && img.height > canvas.height) {
                height = canvas.height;
                width = imgRate * height;
            }
            else if (cancasRate < imgRate && img.width > canvas.width) {
                width = canvas.width;
                height = width / imgRate;
            }
            return {width: width, height: height};
        },
        // 获取坐标基于当前容器的位置
        getClientXY: function (e) {
            var x = e.clientX ? e.clientX : (e.originalEvent.touches ? e.originalEvent.touches[0].clientX : 0);
            var y = e.clientY ? e.clientY : (e.originalEvent.touches ? e.originalEvent.touches[0].clientY : 0);
            return {
                x: x - this.$ele.offset().left,
                y: y - this.$ele.offset().top
            };
        },
        // 定位选择工具
        setPicker: function () {
            var self = this,
                canvas = document.getElementById("canvas_demo"),
                context = canvas.getContext("2d");
            $("#picker").css({
                width: self.pickerConfig.pickerSize.x + "px",
                height: self.pickerConfig.pickerSize.y + "px",
                top: self.pickerConfig.y,
                left: self.pickerConfig.x
            });
            //重绘蒙版
            self.draw(context, self.canvasConfig.img, self.canvasConfig.size);
        },
        //绘制canvas中的图片和蒙版
        draw: function (context, img, size) {
            var self = this;
            var canvas = document.getElementById("canvas_demo");
            var pickerSize = self.pickerConfig.pickerSize,
                offset = self.canvasConfig.offset;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, img.width, img.height, offset.x, offset.y, size.width, size.height);
            //绘制挖洞后的蒙版
            context.save();
            context.beginPath();
            self.pathRect(context, self.pickerConfig.x, self.pickerConfig.y, pickerSize.x, pickerSize.y);
            context.rect(0, 0, canvas.width, canvas.height);
            context.closePath();
            context.fillStyle = "rgba(0, 0, 0,0.7)";
            context.fill();
            context.restore();
            if (self.options.isShowResult) {
                // //绘制结果
                var w = $("#result").width();
                var h = $("#result").height();
                var resContext = $("#result")[0].getContext("2d");
                resContext.clearRect(0, 0, w, h);
                resContext.drawImage(canvas, self.pickerConfig.x, self.pickerConfig.y, pickerSize.x, pickerSize.y, 0, 0, w, h);
            }
        },
        //逆时针用路径自己来绘制矩形，这样可以控制方向，以便挖洞
        // 起点x，起点y，宽度，高度
        pathRect: function (context, x, y, width, height) {
            context.moveTo(x, y);
            context.lineTo(x, y + height);
            context.lineTo(x + width, y + height);
            context.lineTo(x + width, y);
            context.lineTo(x, y);
        },
    }

    $.fn.GetImage = function (options) {
        options = $.extend(defaults, options || {});
        return new GetImage($(this), options);
    }
})(jQuery, window, document);















