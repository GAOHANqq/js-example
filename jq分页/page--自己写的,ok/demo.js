/*
    @param {Object} options  配置信息(详见defaults默认值)
    @author: jianpingGao
    @data: 2019-03-22
*/
(function ($, window, document) {
    var defaults = {
        currentPage:1,          // 当前页,默认为1
        limit: 5,               // 每页显示数量
        totalCount: 50,         // 数据总条数
        callback: function(){return false}     //页码修改后的回调函数
    };
    var pageIndex = 1;
    var Page = function($ele,options){
        this.options = options = $.extend(defaults, options || {});
        this.$ele = $ele;
        this.init();
    }
    Page.prototype = {
        init: function(){
            if( parseInt(this.options.totalCount / this.options.limit) <= 0 ) {
                this.$ele.hide();
                return;
            }

            this.createDom();
            this.renderDom();
            this.bindEvent();
        },
        createDom:function(){
            var self = this;
            self.$ele.empty();
            var pageDom = '<a href="javascript:void(0)" class="prve-btn button">&nbsp;</a>' +
                            '<a href="javascript:void(0)" class="number-btn button num1" style="display: none;"></a>' +
                            '<a href="javascript:void(0)" class="number-btn button num2" style="display: none;"></a>' +
                            '<span class="button pre-dot" style="display: none;">...</span>' +
                            '<a href="javascript:void(0)" class="number-btn button num3" style="display: none;"></a>' +
                            '<a href="javascript:void(0)" class="number-btn button num4" style="display: none;"></a>' +
                            '<a href="javascript:void(0)" class="number-btn button num5" style="display: none;"></a>' +
                            '<span class="button suff-dot" style="display: none;">...</span>' +
                            '<a href="javascript:void(0)" class="number-btn button num6" style="display: none;"></a>' +
                            '<a href="javascript:void(0)" class="number-btn button num7" style="display: none;"></a>' +
                            '<a href="javascript:void(0)" class="next-btn button">&nbsp;</a>';

            self.$ele.append(pageDom);
        },
        renderDom:function(){
            var self = this;
            self.$ele.show();
            var pageCount = parseInt(self.options.totalCount / self.options.limit);
            if (self.options.totalCount % self.options.limit > 0) pageCount++;
            self.options.pageCount = pageCount; // 页码数
            $(".number-btn,.suff-dot,.pre-dot",self.$ele).hide();
            if (pageIndex == 1)
                $(".prve-btn").hide();
            else
                $(".prve-btn").show();
            if (pageIndex == pageCount){
                $(".next-btn").hide();
                $(".searchIcon-btn").hide();
            }
            else
                $(".next-btn").show();

            if (pageCount < 2) {
                $(".prve-btn,.next-btn").hide();
            }
            else if (pageCount <= 7) {
                for (var i = 1; i <= pageCount; i++) {
                    self.$ele.find(".num" + i).html(i).attr("data-index", i).show();
                }
            }
            else {
                $(".num1", self.$ele).html(1).attr("data-index", "1");
                $(".num2", self.$ele).html(2).attr("data-index", "2");
                if (pageIndex <= pageCount - 4)
                    $(".suff-dot", self.$ele).show();
                if (pageIndex <= 4) {
                    $(".pre-dot", self.$ele).hide();
                    $(".num3", self.$ele).html(3).attr("data-index", "3");
                    $(".num4", self.$ele).html(4).attr("data-index", "4");
                    $(".num5", self.$ele).html(5).attr("data-index", "5");
                }
                else if (pageIndex > 4) {
                    $(".pre-dot", self.$ele).show();
                    $(".num3", self.$ele).html(pageIndex - 1).attr("data-index", pageIndex - 1);
                    $(".num4", self.$ele).html(pageIndex).attr("data-index", pageIndex);
                    $(".num5", self.$ele).html(pageIndex + 1).attr("data-index", pageIndex + 1);
                }
                if (pageIndex > pageCount - 4) {
                    $(".suff-dot", self.$ele).hide();
                    $(".num3", self.$ele).html(pageCount - 4).attr("data-index", pageCount - 4);
                    $(".num4", self.$ele).html(pageCount - 3).attr("data-index", pageCount - 3);
                    $(".num5", self.$ele).html(pageCount - 2).attr("data-index", pageCount - 2);
                }
                $(".num6", self.$ele).html(pageCount - 1).attr("data-index", pageCount - 1);
                $(".num7", self.$ele).html(pageCount).attr("data-index", pageCount);
                $(".number-btn", self.$ele).show();
            }

			

            $(".number-btn").removeClass("select");
            $(".number-btn[data-index='" + pageIndex + "']").addClass("select");
            //if( self.options.currentPage == 1){
             //   $(".number-btn").removeClass("select");
             //   $(".number-btn[data-index='" + 1 + "']").addClass("select");
            //}
            self.$ele.show();
        },
        bindEvent:function(){
            var self = this;

            //分页按钮点击
            $('.number-btn').unbind('click').bind('click', function (e) {
                $('.number-btn').removeClass('select');
                pageIndex = parseInt($(this).html());
                self.renderDom();
                self.options.callback && self.options.callback(pageIndex);
            });
            //前一页按钮点击
            $('.prve-btn').unbind('click').bind('click', function () {
                if (pageIndex == 1) return;
                pageIndex --;
                $(".number-btn[data-index='" + pageIndex + "']").trigger("click");
            });
            //前一页按钮点击
            $('.next-btn').unbind('click').bind('click', function () {
                if (pageIndex == self.pageCount) return;
                pageIndex ++;
                $(".number-btn[data-index='" + pageIndex + "']").trigger("click");
            });

        }
    }
    $.fn.Page = function (options) {
        options = $.extend(defaults, options || {});
        return new Page($(this), options);
    }
}(jQuery, window, document));
