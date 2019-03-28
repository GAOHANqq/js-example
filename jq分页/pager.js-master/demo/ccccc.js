; (function ($, window, document, undefined) {
    "use strict";
    var defaults = {
			curcurPageIndex	: 0,	// 当前页
			pageLimit		: 6,    // 每页显示数量
			totalCount		: 50,	// 数据总条数
			pageCount		: 0,
			onPageChanged	: null	//页码修改后的回调函数
    };

    function Pager($ele, options) {
        this.$ele = $ele;
        this.options = options = $.extend(defaults, options || {});
        this.init();
    }
    Pager.prototype = {
        constructor: Pager,
        init: function () {
			this.initHtml();
            this.renderHtml();
            this.bindEvent();
        },
		initHtml:function(){
			var html = '';
			html += '<div class="page-box" style="display: none;">';
            html += '<a href="javascript:void(0)" class="prve-btn button">&nbsp;</a>';
			html += '<a href="javascript:void(0)" class="number-btn button num1 select" style="display: none;"></a>';
            html += '<a href="javascript:void(0)" class="number-btn button num2" style="display: none;"></a>';
            html += '<span class="button pre-dot" style="display: none;">...</span>';
            html += '<a href="javascript:void(0)" class="number-btn button num3" style="display: none;"></a>';
            html += '<a href="javascript:void(0)" class="number-btn button num4" style="display: none;"></a>';
            html += '<a href="javascript:void(0)" class="number-btn button num5" style="display: none;"></a>';
			html += '<span class="button suff-dot" style="display: none;">...</span>';
            html += '<a href="javascript:void(0)" class="number-btn button num6" style="display: none;"></a>';
            html += '<a href="javascript:void(0)" class="number-btn button num7" style="display: none;"></a>';
            html += '<a href="javascript:void(0)" class="next-btn button">&nbsp;</a></div>';
			this.$ele.append(html);
		},
        renderHtml: function () {
			var self = this;
			var el = $.ele;
            var options = this.options;

            var pageCount = Math.ceil(options.totalCount / options.pageLimit);
			if (self.totalCount % self.pageLimit > 0) pageCount++;
			self.pageCount = pageCount;
			$(".number-btn,.suff-dot,.pre-dot", el).hide();

			if(self.curcurPageIndex == 1)
				$(".prve-btn").hide();
			else
				$(".prve-btn").show();
			if(self.curcurPageIndex == pageCount)
				$(".searchIcon-btn").hide();
			else
				$(".next-btn").show();

			if(pageCount <2){
				$(".prve-btn,.next-btn").hide();
			}
			else if (pageCount <= 7) {
				for (var i = 1; i <= pageCount; i++) {
					el.find(".num" + i).html(i).attr("data-index", i).show();
				}
			}
			else {
				$(".num1", el).html(1).attr("data-index", "1");
				$(".num2", el).html(2).attr("data-index", "2");
				if (self.curcurPageIndex <= pageCount - 4)
					$(".suff-dot", el).show();
				if (self.curcurPageIndex <= 4) {
					$(".pre-dot", el).hide();
					$(".num3", el).html(3).attr("data-index", "3");
					$(".num4", el).html(4).attr("data-index", "4");
					$(".num5", el).html(5).attr("data-index", "5");
				}
				else if (self.curcurPageIndex > 4) {
					$(".pre-dot", el).show();
					$(".num3", el).html(self.curcurPageIndex - 1).attr("data-index", this.curcurPageIndex - 1);
					$(".num4", el).html(self.curcurPageIndex).attr("data-index", this.curcurPageIndex);
					$(".num5", el).html(self.curcurPageIndex + 1).attr("data-index", this.curcurPageIndex + 1);
				}
				if (self.curcurPageIndex > pageCount - 4) {
					$(".suff-dot", el).hide();
					$(".num3", el).html(pageCount - 4).attr("data-index", pageCount - 4);
					$(".num4", el).html(pageCount - 3).attr("data-index", pageCount - 3);
					$(".num5", el).html(pageCount - 2).attr("data-index", pageCount - 2);
				}
				$(".num6", el).html(pageCount - 1).attr("data-index", pageCount - 1);
				$(".num7", el).html(pageCount).attr("data-index", pageCount);
				$(".number-btn", el).show();
			}

			$(".page-box .number-btn").removeClass("select");
			$(".page-box .number-btn[data-index='" + self.curcurPageIndex + "']").addClass("select");
			$(el).show();
        },
        bindEvent: function () {
			var self = this;
			//分页按钮点击
            $('.page-box .number-btn').unbind('click').bind('click', function () {
                $('.page-box .number-btn').removeClass('select');
                self.curcurPageIndex = parseInt($(this).html());
                self.onPageChanged();
            });

            //前一页按钮点击
            $('.page-box .prve-btn').unbind('click').bind('click', function () {
                if (self.curcurPageIndex == 1) return;
                self.curcurPageIndex--;
                self.renderHtml();
                $(".page-box .number-btn[data-index='" + self.curcurPageIndex + "']").trigger("click");
            });

            //前一页按钮点击
            $('.page-box .next-btn').unbind('click').bind('click', function () {
                if (self.curcurPageIndex == self.pageCount) return;
                self.curcurPageIndex++;
                self.renderHtml();
                $(".page-box .number-btn[data-index='" + self.curcurPageIndex + "']").trigger("click");
            });
        },
        getcurPageIndex: function () {
            return this.options.curPageIndex;
        },
        setcurPageIndex: function (curPageIndex) {
            this.options.curPageIndex = curPageIndex;
            this.renderHtml();
        },
        settotalCount: function (totalCount) {
            this.options.curPageIndex = 0;
            this.options.totalCount = totalCount;
            this.renderHtml();
        }
    };

    $.fn.pager = function (options) {
        options = $.extend(defaults, options || {});
        return new Pager($(this), options);
    }
})(jQuery, window, document);