/*
    @param {Object} options  配置信息(详见defaults默认值)
    @author: jianpingGao
    @data: 2019-03-20
*/
(function ($, window, document) {
    var defaults = {
        url              : "demo.png",                  // {String} 图片地址url字符串 默认为 "demo.png"
        width            : 500,                         // {Number}          canvas宽度,默认为 500
        height           : 300,                         // {Number}          canvas高度,默认为 300
        saveImg          : function(){return false}     // {function}        回调方法,返回图片base64格式
    }
    function ImageCuter($ele, options) {
        this.options = options = $.extend(defaults, options || {});
        this.$ele = $ele;
        this.eventName = {
            down: "mousedown",
            move: "mousemove",
            up: "mouseup",
            click: "click"
        };
        this.canvasConfig = {
            width: this.$ele.parent().width() || $('html','body').width(),
            height: this.$ele.parent().height() || $('html','body').height(),
            img: null ,              //图片对象
            size: null,             //图片完整显示在canvas容器内的尺寸
            offset: {x: 0, y: 0},   //图片绘制偏移，为了原图不移出框外，这个只能是负值or 0
        }
        this.init();
    }
    ImageCuter.prototype = {
        constructor: ImageCuter,
        init: function () {
            if(!this.options.url) return;
            this.createDom();
            this.picker = $("#picker");
            this.loadImage();
            this.bindEvent();
        },
        createDom: function () {
            var self = this;
            self.$ele.empty();
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

            self.$ele.append(pickerDom);
            self.$ele.prepend(canvas);
        },
        bindEvent: function () {
            var self = this;
            var canvasConfig = self.canvasConfig;
            var canvas = document.getElementById("canvas_demo");
            canvas.width = self.canvasConfig.width;
            canvas.height = self.canvasConfig.height;

            //绑定鼠标在选择工具上按下的事件
            $("#picker").on(self.eventName.down, function (e) {
                e.stopPropagation();
                var start = {
                    x: self.getClientXY(e).x,
                    y: self.getClientXY(e).y,
                    initX: self.pickerConfig.x,
                    initY: self.pickerConfig.y
                };
                self.$ele.on(self.eventName.move, function (e) {
                    // 将x、y限制在框内
                    self.pickerConfig.x = Math.min(Math.max(start.initX + self.getClientXY(e).x - start.x, 0), canvasConfig.width - self.pickerConfig.pickerSize.x);
                    self.pickerConfig.y = Math.min(Math.max(start.initY + self.getClientXY(e).y - start.y, 0), canvasConfig.height - self.pickerConfig.pickerSize.y);
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
                        initX: self.pickerConfig.pickerSize.x,
                        initY: self.pickerConfig.pickerSize.y
                    };
                    self.$ele.on(self.eventName.move, function (e) {
                        // 鼠标变化量
                        var x_ = self.getClientXY(e).x - start.x;
                        var y_ = self.getClientXY(e).y - start.y;
                        var maxTop = start.y + self.pickerConfig.pickerSize.y + start.initY - 20;
                        var maxLeft = start.x + self.pickerConfig.pickerSize.x + start.initX- 20;
                        switch (index) {
                            // 左上
                            case 0 :
                                self.pickerConfig.pickerSize.x = start.initX - x_;
                                self.pickerConfig.pickerSize.y = start.initY - y_;
                                self.pickerConfig.x = start.x + x_;
                                self.pickerConfig.y = start.y + y_;
                                break;
                            // 右上
                            case 1 :
                                self.pickerConfig.pickerSize.x = start.initX - x_;
                                self.pickerConfig.pickerSize.y = start.initY + y_;
                                self.pickerConfig.x = start.x + x_;
                                break;
                            // 右下
                            case 2 :
                                self.pickerConfig.pickerSize.x = start.initX + x_;
                                self.pickerConfig.pickerSize.y = start.initY - y_;
                                self.pickerConfig.y = start.y + y_;
                                break;
                            // 左下
                            case 3 :
                                self.pickerConfig.pickerSize.x = start.initX + x_;
                                self.pickerConfig.pickerSize.y = start.initY + y_;
                                break;
                        }
                        // 极值判断
                        self.pickerConfig.pickerSize.x = Math.max(self.pickerConfig.pickerSize.x, 10);
                        self.pickerConfig.pickerSize.y = Math.max(self.pickerConfig.pickerSize.y, 10);
                        self.pickerConfig.pickerSize.y = Math.min(self.pickerConfig.pickerSize.y,self.canvasConfig.height-self.pickerConfig.y);
                        self.pickerConfig.pickerSize.x = Math.min(self.pickerConfig.pickerSize.x,self.canvasConfig.width-self.pickerConfig.x);
                        self.pickerConfig.y = Math.min(self.pickerConfig.y,maxTop);
                        self.pickerConfig.x = Math.min(self.pickerConfig.x,maxLeft);
                        self.setPicker();
                    })
                });
            });
            $(document).on(self.eventName.up, function () {
                self.$ele.unbind(self.eventName.move);
            });
            // esc取消截屏
            $(document).on(self.eventName.up, function (e) {
                if (e.keyCode == 27) self.cancelCuterImage(); // esc取消截屏
            });
            // 右键取消截屏
            $("#picker").on("contextmenu", function () {
                self.cancelCuterImage();
                return false;
            });
            // 取消截屏
            $(".pic-cancel").on(self.eventName.click, function () {
                self.cancelCuterImage();
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
                self.cancelCuterImage();
            });
        },
        // 加载图片
        loadImage: function () {
            var self = this;
            var img = new Image(),
                canvas = document.getElementById("canvas_demo"),
                context = canvas.getContext("2d");
            img.src = self.options.url;
            img.onload = function () {
                self.canvasConfig.img = img;
                self.canvasConfig.size = self.getFixedSize(img, canvas);

                var width = self.getFixedSize(img, canvas).width;
                var height = self.getFixedSize(img, canvas).height;

                self.canvasConfig.width = width;
                self.canvasConfig.height = height;
                self.$ele.width(width);
                self.$ele.height(height);
                canvas.width = width;
                canvas.height = height;

                self.pickerConfig = {
                    pickerSize: {x: 100, y: 100},
                    x: canvas.width / 2 - 100 / 2,
                    y: canvas.height / 2 - 100 / 2
                }
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, 0, 0, img.width, img.height, self.canvasConfig.offset.x, self.canvasConfig.offset.y, self.canvasConfig.size.width, self.canvasConfig.size.height);
            }
        },
        // 截屏方法
        cuterImage:function(){
            this.picker.show();
            this.setPicker();
        },
        // 取消截屏方法
        cancelCuterImage:function(){
            var canvas = document.getElementById("canvas_demo"),
                context = canvas.getContext("2d");
            this.picker.hide();
            context.clearRect(0, 0, canvas.width, canvas.height);
            this.loadImage();
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
    $.fn.ImageCuter = function (options) {
        options = $.extend(defaults, options || {});
        return new ImageCuter($(this), options);
    }
}(jQuery, window, document));















