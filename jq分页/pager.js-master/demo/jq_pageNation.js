; (function ($, window, document, undefined) {
    "use strict";
    var defaults = {
        pageIndex: 0,	// 当前页
        pageSize: 6,    // 每页显示数量
        itemCount: 50,  // 数据总条数
        maxButtonCount: 7, // 除去第一页和最后一页的最大按钮数量
        prevText: "上一页",
        nextText: "下一页",
        buildPageUrl: null, //构造页码按钮链接href的方法,包含一个pageIndex参数，不传则返回"javascript:;"
        onPageChanged: null //页码修改后的回调函数
    };

    function Pager($ele, options) {
        this.$ele = $ele;
        this.options = options = $.extend(defaults, options || {});
        this.init();
    }
    Pager.prototype = {
        constructor: Pager,
        init: function () {
            this.renderHtml();
            this.bindEvent();
        },
        renderHtml: function () {
            var options = this.options;

            options.pageCount = Math.ceil(options.itemCount / options.pageSize);
            var html = [];

            //生成上一页的按钮
            if (options.pageIndex > 0) {
                html.push('<a page="' + (options.pageIndex - 1) + '" href="' + this.buildPageUrl(options.pageIndex + 1) + '" class="flip">' + options.prevText + '</a>');
            } else {
                html.push('<span class="flip noPage">' + options.prevText + '</span>');
            }

            //这里是关键
            //临时的起始页码中间页码，当页码数量大于显示的最大按钮数时使用
            var tempStartIndex = options.pageIndex - Math.floor(options.maxButtonCount / 2) + 1;

            //计算终止页码，通过max计算一排按钮中的第一个按钮的页码，然后计算出页数量
            var endIndex = Math.min(options.pageCount, Math.max(0, tempStartIndex) + options.maxButtonCount) - 1;
            var startIndex = Math.max(0, endIndex - options.maxButtonCount + 1);

            // 第一页
            if (startIndex > 0) {
                html.push("<a href='" + this.buildPageUrl(0) + "' page='" + 0 + "'>1</a> ");
                html.push("<span>...</span>");
            }

            //生成页码按钮
            for (var i = startIndex; i <= endIndex; i++) {
                if (options.pageIndex == i) {
                    html.push('<span class="curPage">' + (i + 1) + '</span>');
                } else {
                    html.push('<a page="' + i + '" href="' + this.buildPageUrl(options.pageIndex + 1) + '">' + (i + 1) + '</a>');
                }
            }

            // 最后一页
            if (endIndex < options.pageCount - 1) {
                html.push("<span>...</span> ");
                html.push("<a href='" + this.buildPageUrl(options.pageCount - 1) + "' page='" + (options.pageCount - 1) + "'>" + options.pageCount + "</a> ");
            }

            //生成下一页的按钮
            if (options.pageIndex < options.pageCount - 1) {
                html.push('<a page="' + (options.pageIndex + 1) + '" href="' + this.buildPageUrl(options.pageIndex + 1) + '" class="flip">' + options.nextText + '</a>');
            } else {
                html.push('<span class="flip noPage">' + options.nextText + '</span>');
            }

            this.$ele.html(html.join(""));
        },
        bindEvent: function () {
            var that = this;
            that.$ele.on("click", "a", function () {
                that.options.pageIndex = parseInt($(this).attr("page"), 10);
                that.renderHtml();
                that.options.onPageChanged && that.options.onPageChanged(that.options.pageIndex);
            })
        },
        buildPageUrl: function () {
            if ($.isFunction(this.options.buildPageUrl)) {
                return this.options.buildPageUrl(pageIndex);
            }
            return "javascript:;";
        },
        getPageIndex: function () {
            return this.options.pageIndex;
        },
        setPageIndex: function (pageIndex) {
            this.options.pageIndex = pageIndex;
            this.renderHtml();
        },
        setItemCount: function (itemCount) {
            this.options.pageIndex = 0;
            this.options.itemCount = itemCount;
            this.renderHtml();
        }
    };


    $.fn.pager = function (options) {
        options = $.extend(defaults, options || {});

        return new Pager($(this), options);
    }

})(jQuery, window, document);