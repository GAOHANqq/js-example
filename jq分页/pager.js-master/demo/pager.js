!function($) {
    var pg;
    $.pager = pg = function(options) {
        var me = this;
        me.config = $.extend(true, {
            panel: null,
            total: 0,					//总页数
            items: 0,				//总条目
            per: 5,					//每页条目
            changePer: false,//每页条目数可否变化
            changeConfig: [5, 10, 20, 50, 100],//变化每页显示条目数量
            displayPage: 3,//显示连续页数
            showEdge: 2,//显示边缘页数
            showFirstNlast: true, //是否显示“首页“、”末页“按钮
            showPrevNnext: true,//是否显示下/上一页
            prevText: '上一页',//上/下一页文案
            nextText: '下一页',
            firstText: '首页',
            lastText: '末页',
            callback: function() {return false;}
        }, options);
        me.init();
        //点击事件
        me.config.panel && me.config.panel.on('click', function(e) {
			me.pageChangeHandler.call(me, e);
        });
    };

    pg.prototype = {
        id: null,
		current: null,//默认当前页是1
        init: function() {
            var me = this,
                config = me.config,
                total,
                vernier,
                displayPage = config.displayPage,
                id = 'paging_' + parseInt(Math.random()*1000000);
            me.id = id;
            //当前页和起始页初始化为1（第一页）
            me.current = 1;
            config.begin = 1;
            //配置了总条目和每页条目时，计算总页数并覆盖配置的总条数
            config.total = total = (config.items && config.per) ? Math.ceil(config.items/config.per) : (config.total || 1);
            //配置的显示页数大于总页数，则用总页数覆盖配置的显示页数
            if(displayPage >= total) {
                config.displayPage = total;
                config.end = total;
            } else {
                config.end = displayPage;
            }
            //vernier为当前显示页的中间页，其前面应显示before页数，后面应显示after页数
            vernier = Math.ceil((displayPage + 0.5) / 2);
            config.before = vernier - 1;
            config.after = displayPage - vernier;
            //制造分页
            me.generate();
        }, 
		// 处理分页
		generate: function() {
            var me = this,
                html = [],
                config = me.config,
                i, len,
                id = me.id;
            html.push('<div id="' + id + '" class="paging">')
            //首页链接
            if(config.showFirstNlast && me.current > 1) {
                html.push('<span class="first"><a href="javascript:;">' + config.firstText + '</a></span>');
            } else if(config.showFirstNlast) {
                html.push('<span class="first">' + config.firstText + '</span>');
            }
            //上一页链接
            if(config.showPrevNnext && me.current > 1) {
                html.push('<span class="prev"><a href="javascript:;">' + config.prevText + '</a></span>');
            } else if(config.showPrevNnext) {
                html.push('<span class="prev">' + config.prevText + '</span>');
            }
            //左边缘页链接
            for(i = 1, len = config.showEdge; i <= len && len < config.begin; i++) {
                html.push('<span><a href="javascript:;">' + i + '</a></span>');
            }
            //左边缘页与起始页之间有没有间隔，没有不用显示...字样
            if(1 < config.begin - config.showEdge) {
               html.push('<span>...</span>');
            }
            //所有分页连接
            for(i = config.begin, len = config.end; i <= len; i++) {
                if(i != me.current) {
                    html.push('<span><a href="javascript:;">' + i + '</a></span>');
                } else {
                    html.push('<span class="active">' + i + '</span>');
                }
            }
            //右边缘与结尾页之间的间隔
            if(config.end < config.total - config.showEdge) {
                html.push('<span>...</span>');
                i = config.total - config.showEdge + 1;
            } else {
                i = config.end + 1;
            }
            //右边缘页链接
            for(len = config.total; i <= len; i++) {
                html.push('<span><a href="javascript:;">' + i + '</a></span>');
            }
            //下一页链接
            if(me.current < config.total && config.showPrevNnext) {
                html.push('<span class="next"><a href="javascript:;">' + config.nextText + '</a></span>');
            } else if(config.showPrevNnext) {
                html.push('<span class="next">' + config.nextText + '</span>');
            }
            //末页链接
            if(me.current < config.total && config.showFirstNlast){
                html.push('<span class="last"><a href="javascript:;">' + config.lastText + '</a></span>');
            } else if(config.showFirstNlast) {
                html.push('<span class="last">' + config.lastText + '</span>');
            }
            if((changeConfig = config.changeConfig) && (len = changeConfig.length)){
                html.push('<select class="per">');
                for(i = 0; i < len; i++){
                    var selected = changeConfig[i] == config.per ? ' selected="selected"' : '';
                    html.push('<option' + selected + '>' + changeConfig[i] + '</option>');
                }
                html.push('</select>');
            }
            html.push('</div>');
            //绘制到目标位置
            (config.panel instanceof $) && (config.panel.length > 0) && config.panel.html(html.join(''));
            //更改每页显示条目数量事件
            config.panel.find('select.per').on('change', function() {
                config.per = parseInt(this.value);
                me.init();
            });
        },
		// 页码改变
		pageChangeHandler: function(e) {
            var e = e || window.event,
                target = e.target || e.srcElement,
                me = this,
                config = me.config,
                index = parseInt(target.text),
                type,
                changeType = ['prev', 'next', 'first', 'last'],
                theoreticBegin, theoreticEnd, realBegin, realEnd;
            if(target.tagName.toLowerCase() === 'a') {
                e.preventDefault();
            } else {
                return false;
            }
            while(target.tagName.toLowerCase() !== 'span') target = target.parentNode;
            target = $(target);
            //首页末页上一页下一页的信息绑定在class中，是有点别扭
            for(i = 0, len = changeType.length; i < len; i++) {
                if(target.hasClass(changeType[i])) {
                    type = changeType[i];
                    break;
                }
            }
            switch(type) {
                case 'first':
                    me.current = 1;
                    break;
                case 'last':
                    me.current = config.total;
                    break;
                case 'prev':
                    me.current--;
                    break;
                case 'next':
                    me.current++;
                    break;
                default:
                    break;
            }
            //没有class的页码，数字就是其目的页码
            !type && (me.current = index);
            //理论上的开始页和结尾页
            theoreticBegin = me.current - config.before;
            theoreticEnd = me.current + config.after;
            if(theoreticBegin >= 1) {
                realBegin = theoreticBegin;
            }
            if(theoreticEnd <= config.total) {
                realEnd = theoreticEnd;
            }
            if(theoreticBegin < 1) {
                realBegin = 1;
                realEnd = config.displayPage;
            }
            if(theoreticEnd > config.total) {
                realEnd = config.total;
                realBegin = realEnd - config.displayPage + 1;
            }
            config.begin = realBegin;
            config.end = realEnd;
            //翻页后的事件，参数为页码和当前分页组件的配置信息
            config.callback.call(me, me.current, config);
            //重绘
            me.generate();
        }

    };
}(window.jQuery);
