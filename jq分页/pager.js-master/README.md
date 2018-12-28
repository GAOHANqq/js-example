pager.js
========
分页插件

使用方法请看demo


<pre><code>
&lt;!doctype html&gt;
&lt;html&gt;
  	&lt;head&gt;
				&lt;meta charset="utf-8" /&gt;
				&lt;title&gt;pager demo&lt;/title&gt;
		&lt;/head&gt;
		&lt;body&gt;
            &lt;h1&gt;pager demo&lt;/h1&gt;

				&lt;div id="pager"&gt;&lt;/div&gt;
				
				&lt;script src="jquery-1.7.2.js"&gt;&lt;/script&gt;
				&lt;script src="pager.js"&gt;&lt;/script&gt;
                &lt;script&gt;
                    $(function () {
                        new $.pager({
                            panel: $('#pager') //必选。分页内容的容器
                            , per: 10 //建议选。每页显示的条目，总条目items除以每页条目per才能计算总页数。默认是1
                            , items: 298 //建议选。总条目数量。默认是0
                            , callback: function() {console.log(arguments);} //建议选。回调函数自行定义，此处定义翻页操作
                            //, changeConfig:  false//可选。改变每页显示条目的列表，可设置多个数值的数组，将会生成一个下拉框，选择下拉框相应数值将会改变当前配置的per值。默认是[1, 10, 20, 50, 100]
                            //, displayPage: 10 //可选。显示的连续页码,例如有一百页时，显示了中间的30-35页。默认是5
                            //, showEdge:2 //可选。显示边缘页码。例如有一百页时，显示了中间的30-35页，同时显示边缘的1、2页和99、100页。默认是1
                            //, showTotalItems: false //可选。是否显示“共XX条”这样的信息。默认是true（显示）
                            //, showFirstNlast: false //可选。是否显示“首页“、”末页“按钮。默认是true（显示）
                            //, showPrevNnext: false //可选。是否显示下、上一页按钮。默认是true（显示）
                            //, prevText: 'pre' //可选。上一页文案。默认是”上一页“
                            //, nextText: 'next' //可选。下一页文案。默认是”下一页“
                            //, firstText: 'first' //可选。首页文案。默认是”首页“
                            //, lastText: 'last' //可选。末页文案。默认是”末页“
                        });
                    });
            &lt;/script&gt;
		&lt;/body&gt;
&lt;/html&gt;

</code></pre>
