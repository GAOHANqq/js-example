$(function () {
    var pageFunc = {
        noPicDiv: null,  //无提交图片提示层
        loadFailedDiv: null,//加载失败遮罩层
        loadingDiv: null,  //loading遮罩层
        picQuesDiv: null,           //普通图片题目批改区域
        workid: "",                  //作业id
        queid: "",                   //题目id
        quetype: "",            //题目类型
        quepid: "",             //小题的父级大题id，用于小题进入时根据此大题id在quesList中搜索小题列表等
        isrec: 0,                   //是否重批
        isrevise:0,                //是否订正
        isUnSwitchRevise:false,//禁止切换批改状态
        classid: "",            //当前批改题目所选的班级id
        quesIds: [],         //大题的id列表，和quesList中对应
        quesList: [],       //本地存储的当前作业下的大题列表
        completeCount: 0,  //已批改学生数
        totalCount: 0,           //当前题目提交学生总数
        quesInfo: null,          //当前大题信息
        quesData: null,          //当前题目信息
        correctData: null,          //当前题目json对象，用于本地缓存，在重新进入正在上传的题目时，加载已批改的题目分数信息等
        picList: [],                        //答题图片列表，保存图片文件名，通过picpathlist中的source截取
        oldPicList:[],                    //批阅订正时 获取答题图片资源
        currentPicIndex: 0,          //当前加载的图片index
        stuList: [],                         //未批改学生id列表
        allStuList:[],                      //所有学生id列表
        currentStuid: "",           //当前选中的学生shwid
        isRight: 0,              //大题是否正确，如果是按小题批改，小题全对为1，全错为0，其他为-1
        lastChangeStuFlag: 0,    //最后一次执行学生切换操作类型：前一个为-1，未切换为0，后一个为1
        saveQuesImageCallback: null,     //保存批改图片函数回调
        recorrectList: [],       //记录该页面批改完成的大题id
        isCanvasNotReady: false,   //切图等操作时，禁用写画工具标识
        uploadingStuList: [],        //当前题目正在上传提交结果的学生ids
        isSubmitting: false,        //当前是否在执行提交操作，在doSubmit时置为true，在initCorrectData时重置
        //快速预览页面需要字段
        curQid: "",
        curQtype: "",
        curPageIndex: 1,
        curPageSize: 10,
        isLoading: false,
        imgSize: {w: 0, h: 0},
        init: function () {
            //页面高度获取
            this.layout(45);
            this.noPicDiv = $(".tqb-nopic");
            this.loadFailedDiv = $(".tqb-loadfail");
            this.loadingDiv = $(".tqb-loading");
            this.workid = getQueryStringRegExp("workid");
            this.queid = getQueryStringRegExp("queid");
            this.quetype = getQueryStringRegExp("quetype");
            this.quepid = getQueryStringRegExp("pid");
            this.isrec = getQueryStringRegExp("isrec");
            this.isrevise = getQueryStringRegExp("isRevise");
            $('.grist-box span.cur').css('background', '#FF0000'); //默认笔画粗细颜色为红色
            this.picQuesDiv = $(".test-questions-box");
            this.bindEvent();
            //快速预览事件
            this.bindQuickViewEvent();
            //初始化tooltip配置参数
            $('body').tooltip({
                autohide: true,
                duration: 2000,
                zIndex: 999,
                position: "center middle",
                style: "danger",
            });


            if(this.isrevise=="1"){
                $(".zoom-op-top .isWell,.isWrong,.iscorrect").hide();
                $(".top-opbox .exercises-info").hide();
            }
            $("#canvasImg,#canvasPaint").css("transform", "rotate(0deg) scale(1.0)");
            this.startProcess();
        },
        //设置屏幕高度
        layout: function (tep) {
            var w_height = $(window).height();
            var m_height = w_height - 72;
            var mc_height = m_height - tep;
            $(".main").height(m_height);
            $('.main-right-content').height(mc_height);
            $('.main-left-content').height(mc_height);
            $('.mark-float-window').css('max-height', mc_height);
			var oldDiv=$('.oldpic-div');
			$('.ulList',oldDiv).height(m_height - $('.grade-title',oldDiv).height()-$('.subject-box-top',oldDiv).height());
        },

        bindEvent: function () {
            //窗体改变
            $(window).resize(function () {
                pageFunc.layout(45);
                canvasFunc.resize();
            });
            //绑定键盘监听事件
            document.onkeyup = pageFunc.handleKeyboard;
            //返回列表页
            $(".return-btn").click(function () {
                pageFunc.backToWorkList();
            });

            //习题选择下拉菜单
            $('.list-down .tit').click(function () {
                if (!$(this).parent().find('.list-box').is(':visible')) {
                    $(this).parent().find('.list-box').slideDown();
                    $(this).addClass('up-list');
                } else {
                    $(this).parent().find('.list-box').slideUp();
                    $(this).removeClass('up-list');
                }
            });

            //画笔粗细选择
            $('.grist-box span').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                $('.grist-box span').removeClass('cur');
                $('.grist-box span').css('background', '#BFBFBF');
                $(this).addClass('cur');
                $('.grist-box span.cur').css('background', canvasFunc.currentColor);
                canvasFunc.currentThickness = $(this).data("thickness");
            });

            //色块选择
            $('.color-box a').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                $('.color-box a').removeClass('cur');
                $(this).addClass('cur');
                $('.grist-box span.cur').css('background', $(this).data('color'));
                canvasFunc.currentColor = $(this).data('color');
                $('.zoom-draw-box a.pen').trigger('click');
            });

            //画笔工具选择
            $('.draw-base-box a.pen').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                $('.draw-base-box a').removeClass('cur');
                $('.zoom-op-top a').removeClass('cur');
                $(this).addClass('cur');
                canvasFunc.currentState = canvasFunc.opt_stat.pen;
                $("#canvasPaint,#canvasImg").css("cursor", "default");
            });

            //橡皮工具选择
            $('.draw-base-box a.eraser').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                $('.draw-base-box a.pen').removeClass('cur');
                $('.zoom-op-top a').removeClass('cur');
                $(this).addClass('cur');
                canvasFunc.currentState = canvasFunc.opt_stat.eraser;
                $("#canvasPaint,#canvasImg").css("cursor", "default");
            });

            //移动工具
            $('.zoom-op-top a.move').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                $('.draw-base-box a.pen').removeClass('cur');
                $('.draw-base-box a').removeClass('cur');
                $('.zoom-op-top a').removeClass('cur');
                $(this).addClass('cur');
                canvasFunc.currentState = canvasFunc.opt_stat.hand;
                $("#canvasPaint,#canvasImg").css("cursor", "move");
            });

            //恢复缩放和移动
            $('.zoom-op-top a.restore').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                pageFunc.restState();
            });

            //区域放大按钮
            $('.zoom-op-top a.enlargement').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                $('.draw-base-box a.pen').removeClass('cur');
                $('.draw-base-box a.eraser').removeClass('cur');
                $('.zoom-op-top a').removeClass('cur');
                $(this).addClass('cur');
                canvasFunc.currentState = canvasFunc.opt_stat.expand;
                $("#canvasPaint,#canvasImg").css("cursor", "crosshair");
            });

            //区域缩小按钮
            $('.zoom-op-top a.shrink').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                $('.draw-base-box a.pen').removeClass('cur');
                $('.draw-base-box a.eraser').removeClass('cur');
                $('.zoom-op-top a').removeClass('cur');
                $(this).addClass('cur');
                canvasFunc.currentState = canvasFunc.opt_stat.shrunk;
                $("#canvasPaint,#canvasImg").css("cursor", "crosshair");
            });

            //画布旋转
            $('.zoom-op-top a.rotate').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                var isRotate = false;
                switch (canvasFunc.currentRote) {
                    case 0:
                        isRotate = true;
                        canvasFunc.currentRote = 90;
                        break;
                    case 90:
                        canvasFunc.currentRote = 180;
                        break;
                    case 180:
                        isRotate = true;
                        canvasFunc.currentRote = 270;
                        break;
                    case 270:
                        canvasFunc.currentRote = 0;
                        break;
                }
                var scale = 1;
                if (isRotate) {
                    if (pageFunc.imgSize.w > $(".test-questions-box").height())
                        scale = $(".test-questions-box").height() / pageFunc.imgSize.w;
                    if (pageFunc.imgSize.h > $(".test-questions-box").width())
                        scale = $(".test-questions-box").width() / pageFunc.imgSize.h;
                }
                canvasFunc.doScale(scale);
            });

            //订正按钮
            $('.zoom-op-top a.iscorrect').click(function () {
                if(pageFunc.isUnSwitchRevise) return;
                var isrevise = 0;
                if($(this).hasClass("cur")){
                    isrevise = 0;
                    $(".test-questions-box .tqb-hint").hide();
                    $(this).removeClass("cur");
                }else{
                    isrevise = 1;
                    $(".test-questions-box .tqb-hint").show();
                    $(this).addClass("cur");
                    trackFunc.clickRevise(JSON.stringify({"time": new Date().toLocaleString(),type:pageFunc.quesInfo.typeid}));
                }
                if(pageFunc.quesInfo.iscorrect == 1){
                    if(pageFunc.quesInfo.mainid == pageFunc.queid){
                        pageFunc.quesInfo.isrevise = isrevise;
                    }
                }else{
                    if(pageFunc.quesInfo.queschilds[0].optionid == pageFunc.queid){
                        pageFunc.quesInfo.queschilds[0].isrevise = isrevise;
                    }
                }
            });

            //优秀作答
            $('.zoom-op-top a.isWell').click(function () {
                var evastate = 0;
                if($(this).hasClass("cur")){
                    evastate = 0;
                    $(".test-questions-box .well-hint").hide();
                    $(this).removeClass("cur");
                }else{
                    evastate = 1;
                    $(".test-questions-box .well-hint").show();
                    $(".test-questions-box .wrong-hint").hide();
                    $(this).addClass("cur");
                    $('.zoom-op-top a.isWrong').removeClass("cur");
                    trackFunc.clickWell(JSON.stringify({"time": new Date().toLocaleString(),type:pageFunc.quesInfo.typeid}));
                }
                if(pageFunc.quesInfo.iscorrect == 1){
                    if(pageFunc.quesInfo.mainid == pageFunc.queid){
                        pageFunc.quesInfo.evastate = evastate;
                    }
                }else{
                    if(pageFunc.quesInfo.queschilds[0].optionid == pageFunc.queid){
                        pageFunc.quesInfo.queschilds[0].evastate = evastate;
                    }
                }
            });

            //典型错误
            $('.zoom-op-top a.isWrong').click(function () {
                var evastate = 0;
                if($(this).hasClass("cur")){
                    evastate = 0;
                    $(".test-questions-box .wrong-hint").hide();
                    $(this).removeClass("cur");
                }else{
                    evastate = 2;
                    $(".test-questions-box .wrong-hint").show();
                    $(".test-questions-box .well-hint").hide();
                    $(this).addClass("cur");
                    $('.zoom-op-top a.isWell').removeClass("cur");
                    trackFunc.clickWrong(JSON.stringify({"time": new Date().toLocaleString(),type:pageFunc.quesInfo.typeid}));
                }
                if(pageFunc.quesInfo.iscorrect == 1){
                    if(pageFunc.quesInfo.mainid == pageFunc.queid){
                        pageFunc.quesInfo.evastate = evastate;
                    }
                }else{
                    if(pageFunc.quesInfo.queschilds[0].optionid == pageFunc.queid){
                        pageFunc.quesInfo.queschilds[0].evastate = evastate;
                    }
                }
            });

            //撤销
            $('.draw-base-box a.undo').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                canvasFunc.undo();
            });

            //重做
            $('.draw-base-box a.redo').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                canvasFunc.redo();
            });

            //清空笔迹
            $('.draw-base-box a.clear').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                $.MsgBox.Confirm("提示", "确定要清除本次全部笔迹？", function () {
                    pageFunc.restState();
                    canvasFunc.isCurrentPicCorrected = false;
                    var pic = pageFunc.picList[pageFunc.currentPicIndex];
                    if (pic.name != "") {
                        cef.message.sendMessage('micro.jsMsgExecFunc', ['empty', getFsRootUrl() + pic.oldPath]);
                    }
                });
            });

            //缩放滑条
            $('.zoom-drag-line .rangeScale').change(function () {
                if (pageFunc.isCanvasNotReady) return;
                $('.draw-base-box a.pen').trigger("click");
                canvasFunc.doScale($(this).val());
            });

            //中心放大按钮
            $('.zoom-drag .scale-up').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                var max_num = parseFloat($('.zoom-drag-line input').val()) + 0.1;
                canvasFunc.doScale(max_num);
            });

            //中心缩小按钮
            $('.zoom-drag .scale-down').click(function () {
                if (pageFunc.isCanvasNotReady) return;
                var min_num = parseFloat($('.zoom-drag-line input').val()) - 0.1;
                canvasFunc.doScale(min_num);
            });

            //打分板浮动按钮点击
            $('.float-btn').click(function () {
                $('.main-left').css('margin-right', '0px');
                $('.main-right').hide();
                $('.mark-float-window').show();
                var optid = pageFunc.quesInfo.iscorrect == 0 ? $(".item-box input.cur_focus", $(".main-right-content")).data("optid") : $(".subject-box input.cur_focus", $(".main-right-content")).data("optid");
                pageFunc.setDefaultScoreInput(false, optid);
                canvasFunc.resize();
            });

            //打分板浮动关闭按钮
            $('.close-float').click(function () {
                $('.main-left').css('margin-right', '231px');
                $('.main-right').show();
                $('.mark-float-window').hide();
                var optid = pageFunc.quesInfo.iscorrect == 0 ? $(".item-box input.cur_focus", $('.mark-float-window')).data("optid") : $(".subject-box input.cur_focus", $('.mark-float-window')).data("optid");
                pageFunc.setDefaultScoreInput(false, optid);
                canvasFunc.resize();
            });

            //是否显示详细打分板显示
            $('.dgb-display').click(function () {
                if ($(this).is('.select')) {
                    $('.dgb-display').removeClass('select');
                    $('.main-right-content .detail-grade-board').hide();
                    $('.float-window-content .detail-grade-board').hide();
                } else {
                    $('.dgb-display').addClass('select');
                    //勾选打分板，显示已选中题目的软键盘
                    var container = $(".mark-float-window").is(":hidden") ? $(".main-right-content") : $(".mark-float-window");
                    var optid = pageFunc.quesInfo.iscorrect == 0 ? $(".item-box input.cur_focus", container).data("optid") : $(".subject-box input.cur_focus", container).data("optid");
                    pageFunc.setDefaultScoreInput(false, optid);
                }
            });

            //提交分数
            $('.submit-score').click(function () {
                pageFunc.doSubmit();
            });

            //快速预览
            $(".quick-browse").click(function () {
                trackFunc.clickPreview(JSON.stringify({"time": new Date().toLocaleString()}));
                $(".quick-viewing-wrap").show();
                pageFunc.getWorkInfo();
            });
            // alert(document.body.clientWidth);

            //收起工具栏
            $('.up-toolbar').click(function () {
                if ($('.top-exe-op').is(":visible")) {
                    $(this).addClass('down');
                    $('.top-exe-op').slideUp();
                    $('.up-toolbar').text('');
                    pageFunc.layout(0);

                } else {
                    $(this).removeClass('down');
                    $('.top-exe-op').slideDown();
                    $('.up-toolbar').text('收起工具栏');
                    pageFunc.layout(45);
                }
            });
            pageFunc.bindChangeTabsEvent();
        },
        bindQuickViewEvent: function () {
            var quickContainer = $(".quick-viewing-wrap");
            var isQuestion = true;//按题查看 true 按人查看 false
            var imgDeg = 0; // 图片旋转角度
            $(".tab-head input",quickContainer).click(function () {
               $(this).addClass("active").siblings().removeClass("active");
               if($(this).data("index")==1){
                   $(".content-ques",quickContainer).show();
                   $(".content-stu",quickContainer).hide();
                   pageFunc.getWorkInfo();
                   isQuestion = true;
               }else{
                   $(".content-ques",quickContainer).hide();
                   $(".content-stu",quickContainer).show();
                   pageFunc.getStuInfo();
                   isQuestion = false;
               }
            });

            $(".top-return", quickContainer).click(function () {
                quickContainer.hide();
                $(".main-list .ulList").empty();
            });

            $(".top-refresh", quickContainer).click(function () {
                if(isQuestion){
                    pageFunc.getWorkInfo();
                }else{
                    pageFunc.getStuInfo();
                }
            });

            $(".content-left .content-ques").delegate(".click-ques,.down", "click", function () {
                $(".main-list .ulList").empty();
                if (!$(this).hasClass("click-ques")) {
                    $(this).parent().find("li:first").trigger("click");
                    return;
                }
                pageFunc.curQid = $(this).data("qid");
                pageFunc.curQtype = $(this).data("type");
                pageFunc.curPageIndex = 1;
                pageFunc.getCurrentQuesSubmit(pageFunc.curQid, pageFunc.curQtype);
            });

            $(".content-left .content-ques").delegate(".bigTopic .down", "click", function () {
                $(this).addClass('active');
                $(this).parent().siblings().find(".down").removeClass('active');
                $(this).parent().siblings().find("li").removeClass('select');
                if ($(this).parent().find(".smallTopic")) {
                    $(this).parent().find("li:first").addClass('select');
                }
            });
            $(".content-left .content-ques").delegate(".smallTopic li", "click", function () {
                $(this).siblings().removeClass('select');
                $(this).parents(".content-ques").find("li").removeClass('select');
                $(this).parents(".content-ques").find(".down").removeClass('active');
                $(this).parents(".bigTopic").find(".down").addClass("active");
                $(this).addClass('select');
            });

            $(".content-left .content-stu").delegate(".stu-item", "click", function () {
                $(this).addClass("active").siblings().removeClass("active");
                $(".main-list .ulList").empty();
                pageFunc.getCurrentStuSubmit($(this).data("shwid"));
            });

            $(".content-right").scroll(function () {
                if (pageFunc.isLoading || !isQuestion) return;
                var height = $(this).height();//div可视区域的高度
                var scrollHeight = $(this)[0].scrollHeight;//滚动的高度，$(this)指代jQuery对象，而$(this)[0]指代的是dom节点
                var scrollTop = $(this)[0].scrollTop;//滚动条的高度，即滚动条的当前位置到div顶部的距离
                if (height + scrollTop >= scrollHeight) {
                    pageFunc.isLoading = true;
                    pageFunc.curPageIndex++;
                    pageFunc.getCurrentQuesSubmit(pageFunc.curQid, pageFunc.curQtype);
                }
            });
            
            $(".content-right").delegate(".ulList .img-rotate","click",function(){
                var $imgWrap = $(this).siblings(".detailImg");
                var $img = $imgWrap.find("img");
                var w_index = pageFunc.getQuickImgIndexWidth();

                imgDeg = (imgDeg+90)%360;

                // if( $img.height() < $imgWrap.height() ){
                //     $img.width( w_index );
                // }

                $img.css("transform", "rotate("+imgDeg+"deg"+")");
            });
        },
        restState: function () {
            $("#canvasPaint,#canvasImg").css("transform", "rotate(0deg) scale(1.0)");
            $(".zoom-ratio").html("100%");
            $('.zoom-drag-line .rangeScale').val(1);
            $('.draw-base-box a.eraser').removeClass('cur');
            $('.draw-color-box a.pen').addClass('cur');
            canvasFunc.scalePath = 1;
            canvasFunc.currentRote = 0;
            if(canvasFunc.currentState == canvasFunc.opt_stat.eraser){
                canvasFunc.currentState = canvasFunc.opt_stat.pen
                $('.draw-base-box a.draw-icon').addClass('cur');
            }
        },
        getWorkInfo: function () {
            globalObj.ajaxHttp("getWorkDetails", {workId: pageFunc.workid,isRevise:pageFunc.isrevise,classId:pageFunc.classid}, function (data) {
                var quickContainer = $(".quick-viewing-wrap");
                $(".submitCount", quickContainer).text(data.submitCount);
                $(".totalStu", quickContainer).text(data.students);
                var html = "";
                for (var i = 0; i < data.quesList.length; i++) {
                    var ques = data.quesList[i];
                    //填空题和主观题才需要快速预览
                    if (ques.typeid == 6 || ques.typeid == 3) {
                        var bigClick = ques.iscorrect == "1" ? 'click-ques" data-qid="' + ques.id + '" data-type="0"' : '"';
                        html += '<div class="bigTopic"><p class="down ' + bigClick + '>' + ques.title + '</p>';
                        if (ques.iscorrect == 0) {
                            //按小题
                            html += '<ul class="smallTopic">';
                            for (var j = 0; j < ques.smallquesList.length; j++) {
                                var sques = ques.smallquesList[j];
                                html += '<li class="click-ques" data-qid="' + sques.id + '" data-type="1">第' + sques.sort + '小题</li>';
                            }
                            html += '</ul>';
                        }
                        html += '</div>';
                    }
                }
                $(".content-left .content-ques", quickContainer).empty().append(html);
                $(".content-left .content-ques .click-ques:first").trigger("click");
            });
        },
        getStuInfo:function () {
            globalObj.ajaxHttp("getStudents",{workId:pageFunc.workid,classId:pageFunc.classid,isRevise:pageFunc.isrevise},function (data) {
                var html = "<ul>";
                for (var i = 0; i < data.length; i++) {
                    var stu = data[i];
                    html+="<li class='stu-item' data-shwid='"+stu.shwid+"'>"+stu.realname+"</li>";
                }
                html +="</ul>";
                $(".content-left .content-stu").empty().append(html);
                $(".content-left .content-stu .stu-item:first").trigger("click");
            });
        },
        getCurrentQuesSubmit: function (qid, qtype) {
            //第一页数据需要加载动画
            if(pageFunc.curPageIndex ==1)
                $(".ques-loading").show();
            globalObj.ajaxHttp("getQuesSubmit", {
                workId: pageFunc.workid,
                queId: qid,
                queType: qtype,
                classId: pageFunc.classid,
                page: pageFunc.curPageIndex,
                pageSize: pageFunc.curPageSize,
                isRevise:pageFunc.isrevise
            }, function (json) {
                var container = $(".main-list .ulList");
                var html = "";
                var data = json.stuList;
                //渲染所有学生图片
                var isNoData = true;
                if (data) {
                    for (var i = 0; i < data.length; i++) {
                        var pics = data[i].workinfo.picpathlist;
                        // console.log(JSON.stringify(pics));
                        if(pics.length>0) {
                            isNoData = false;
                            for (var j = 0; j < pics.length; j++) {
                                var title = data[i].name + " " + (j + 1) + "/" + pics.length;
                                html +=pageFunc.getQuickImg(title,pics[j].source,data[i]);
                            }
                        }
                    }
                    container.append(html);
                }
                if (json.page == 1 && isNoData){
                    container.html('');
                    html = '<div style="width: 100%;height: 100%;position:absolute;left:0;right:0;top:0;bottom:0;" class="no-data"><a>该题学生没有作答~</a></div>';
                    container.append(html);
                }
                // container.append(html);
                pageFunc.isLoading = false;
                $(".ques-loading").hide();
            });
        },
        getCurrentStuSubmit:function (shwid) {
            $(".ques-loading").show();
            globalObj.ajaxHttp("getStuSubmit",{shwId:shwid,isRevise:pageFunc.isrevise},function (data) {
                var container = $(".main-list .ulList");
                var html = "";
                data.forEach(function (item) {
                    var title = item.list_maintitle;
                    //大题
                    if(item.iscorrect==1){
                        item.picpathlist.forEach(function (pic,index) {
                            var tit = title+" "+(index+1)+"/"+item.picpathlist.length;
                            html += pageFunc.getQuickImg(tit,pic.source,item);
                        });
                    }else{
                        item.queschilds.forEach(function (child) {
                            child.picpathlist.forEach(function (pic,index) {
                                var tit = title+" - "+child.sortorder+" "+(index+1)+"/"+child.picpathlist.length;
                                html += pageFunc.getQuickImg(tit,pic.source,child);
                            });
                        });
                    }
                });
                if(html=="" && pageFunc.isrevise=="1")
                    html = '<div style="width: 100%;height: 100%;position:absolute;left:0;right:0;top:0;bottom:0;" class="no-data"><a>该学生尚未订正</a></div>';
                container.append(html);
                $(".ques-loading").hide();
            });
        },
        getQuickImg:function (title,src,obj) {
            var imgurl = getFsRootUrl() + src+"?t="+new Date().getTime();/*避免缓存*/
            return template('tpl-pic-item', {item: obj,imgurl:imgurl,title:title,isrevise:pageFunc.isrevise});
        },
        getQuickImgIndexWidth:function(){
            var width = $(".content-right").find(".ulList li img").width();
            return width;
        },
        /*处理键盘事件*/
        handleKeyboard: function (event) {
            var e = event || window.event || arguments.callee.caller.arguments[0];
            var container = $(".mark-float-window").is(":hidden") ? $(".main-right-content") : $(".mark-float-window");
            var scoreInputIndex = parseInt($('.item-box-line .item-box-title input.cur_focus', container).data("index"));
            var mainInput = $('.subject-box .subject-box-top input.cur_focus');
            var input = $('.item-box-line .item-box-title input.cur_focus');
            switch (e.keyCode) {
                case 38: //光标上，切换上一个小题分数框
                    scoreInputIndex--;
                    pageFunc.changeScoreInput(scoreInputIndex, true);
                    break;
                case 40: //光标下，切换下一个小题分数框
                    scoreInputIndex++;
                    pageFunc.changeScoreInput(scoreInputIndex, true);
                    break;
                case 37://光标左，切换上一张图片
                    $(".tq-tab.pre-ques").trigger("click");
                    break;
                case 39://光标右，谢欢下一张图片
                    $(".tq-tab.next-ques").trigger("click");
                    break;
                case 96:
                case 97:
                case 98:
                case 99:
                case 100:
                case 101:
                case 102:
                case 103:
                case 104:
                case 105://小键盘0~9
                    pageFunc.handleKeyboardNumInput(input, mainInput, container, e.keyCode, true);
                    break;
                case 48:
                case 49:
                case 50:
                case 51:
                case 52:
                case 53:
                case 54:
                case 55:
                case 56:
                case 57://键盘0~9
                    pageFunc.handleKeyboardNumInput(input, mainInput, container, e.keyCode, false);
                    break;
                case 110:
                case 190://键盘.
                    if (pageFunc.quesInfo.iscorrect == 0) {
                        //小题批改
                        if (input.is(":focus") || pageFunc.hasDot(input.val()))
                            return;
                        input.val(input.val() + ".");
                    } else {
                        //大题批改
                        if (mainInput.is(":focus") || pageFunc.hasDot(mainInput.val()))
                            return;
                        mainInput.val(mainInput.val() + ".");
                    }
                    break;
                case 13://回车键
                    scoreInputIndex++;
                    if (!pageFunc.changeScoreInput(scoreInputIndex, true))
                        pageFunc.doSubmit();//切换下一小题，如果最后一小题则提交本次批改
                    break;
                case 27:
                case 8:
                case 46://ESC键、Back键和del键
                    if (input.is(":focus") || mainInput.is(":focus"))
                        return;
                    if (pageFunc.quesInfo.iscorrect == 0)
                        input.val("");
                    else
                        mainInput.val("");
                    break;
            }
        },

        /*处理键盘数字输入*/
        handleKeyboardNumInput: function (input, maininput, container, keycode, islittle) {
            var temp = islittle ? 96 : 48;
            if (pageFunc.quesInfo.iscorrect == 0) {
                if (!$('.item-box-line .item-box-title input.cur_focus', container).is(":focus"))
                    return;
                if ($('.item-box-line .item-box-title input.cur_focus', container).data("modified") == "0") {
                    input.val("");
                    $('.item-box-line .item-box-title input.cur_focus', container).data("modified", "1");
                }
                input.val(input.val() + (keycode - temp));
                pageFunc.checkScoreInput();
                pageFunc.calcTotalScore();
            } else {
                if (!$('.subject-box .subject-box-top input.cur_focus', container).is(":focus"))
                    return;
                if ($('.subject-box .subject-box-top input.cur_focus', container).data("modified") == "0") {
                    maininput.val("");
                    $('.subject-box .subject-box-top input.cur_focus', container).data("modified", "1");
                }
                maininput.val(maininput.val() + (keycode - temp));
                pageFunc.checkMainScoreInput();
            }
        },

        /*切换打分文本框*/
        changeScoreInput: function (index, isChangeImg) {
            var container = $(".mark-float-window").is(":hidden") ? $(".main-right-content") : $(".mark-float-window");
            var input = $('.item-box-line .item-box-title input[data-index=' + index + ']');
            if (input.length == 0)
                return false;
            $(".detail-grade-board").hide();
            $('.item-box-line .item-box-title input.cur_focus').blur();//当前的文本框失去焦点
            $(".item-box input").removeClass("cur_focus");
            input.each(function (index, item) {
                $(item).addClass("cur_focus");
                if ($('.dgb-display').is(".select"))
                    $(item).parent().siblings().slideDown();
                $(item).data("modified", "0");//重置内容修改状态
            });
            if (isChangeImg)
                pageFunc.handleQuesImageChange($(input).data("optid")); //切换到当前小题所对应的第一张答题图片
            pageFunc.checkNoScoreInput();//处理未输入分数的打分框
            return true;
        },

        /*处理切题后，答题图片的切换*/
        handleQuesImageChange: function (optid) {
            var pic = pageFunc.picList[pageFunc.currentPicIndex];
            //如果当前图片属于当前已选中的小题，则不切换
            // if (pic.optid + "" == optid || pageFunc.quesInfo.iscorrect == 1 || pageFunc.quesInfo.isphoto == 1)
            //     return;
            pageFunc.currentPicIndex = -1;
            for (var i = 0; i < pageFunc.picList.length; i++) {
                var item = pageFunc.picList[i];
                //根据optid找到第一张答题图片，获取index
                if (item.optid + "" == optid) {
                    pageFunc.currentPicIndex = item.index;
                    break;
                }
            }
            //请求接口发送图片数据
            if (pageFunc.currentPicIndex >= 0) {
                //保存批改的图片
                if (canvasFunc.isCurrentPicCorrected)
                    pageFunc.saveQuesImage(pic, pageFunc.loadImage);
                else
                    pageFunc.loadImage();
                $(".tq-tab").removeClass("no-tabs");
            }
            //按钮置灰
            if (pageFunc.currentPicIndex <= 0) {
                pageFunc.currentPicIndex = 0;
                pageFunc.showNoPicDiv(true);
                $(".tq-tab.pre-ques").addClass("no-tabs");
            } else if (pageFunc.currentPicIndex >= pageFunc.picList.length - 1) {
                pageFunc.currentPicIndex = pageFunc.picList.length - 1;
                $(".tq-tab.next-ques").addClass("no-tabs");
            }
        },

        /*根据当前图片索引，加载答题图片*/
        loadImage: function () {
            pageFunc.restState();
            //如果是订正状态  显示第一次批阅资源  隐藏打分板
            if(pageFunc.isrevise == 1){
                pageFunc.loadOldPicHtml();
                //隐藏打分板
                $(".main-right .grade-div").hide();
            }
            var pic = pageFunc.picList[pageFunc.currentPicIndex];
            if (pic && pic.name != "") {
                cef.message.sendMessage('micro.jsMsgExecFunc', ['loadQuesImage', pic.name]);
            } else {
                pageFunc.showNoPicDiv(true);//显示未提交图片提示
                return;
            }

            //根据切换的图片所属题目，将对应题的打分框设置焦点
            var index = "";
            var container = $(".mark-float-window").is(":hidden") ? $(".main-right-content") : $(".mark-float-window");
            if (pageFunc.quesInfo.iscorrect == 0)
                index = $(".item-box input[data-optid=" + pic.optid + "]", container).not(".cur_focus").data("index");
            else
                index = $(".subject-box input[data-optid=" + pic.optid + "]", container).not(".cur_focus").data("index");
            pageFunc.changeScoreInput(index, false);
        },
        loadOldPicHtml:function () {
            var ulContainer = $(".main-right .ulList");
            //渲染批阅图片
            ulContainer.empty();
            if(pageFunc.oldPicList.length == 0){
                var html = '<li><div class="oldImg"><img class="no-datas"></div></li>';
                ulContainer.append(html);
            }else{
                var html = "";
                pageFunc.oldPicList.forEach(function (value) {
                    var imgurl = getFsRootUrl()+value.path+"?t="+new Date().getTime();
                    html += '<li><div class="oldImg"><img data-original="'+imgurl+'" onerror="getErrorImg(this)" class="homework-img" src="'+imgurl+'"></div></li>';
                });
                ulContainer.append(html);
                //绑定之前先销毁
                ulContainer.viewer('destroy');
                ulContainer.viewer();
            }
        },

        /*绑定答题图片和学生切换事件*/
        bindChangeTabsEvent: function () {
            //前一张图
            $(".tq-tab.pre-ques").unbind("click").bind("click", function () {
                if ($(this).hasClass("no-tabs")) return;
                var pic = pageFunc.picList[pageFunc.currentPicIndex];
                pageFunc.currentPicIndex--;
                //请求接口发送图片数据
                if (pageFunc.currentPicIndex >= 0) {
                    //保存批改的图片
                    if (canvasFunc.isCurrentPicCorrected)
                        pageFunc.saveQuesImage(pic, pageFunc.loadImage);
                    else
                        pageFunc.loadImage();
                    $(".tq-tab.next-ques").removeClass("no-tabs");
                }
                //按钮置灰
                if (pageFunc.currentPicIndex <= 0) {
                    pageFunc.currentPicIndex = 0;
                    $(this).addClass("no-tabs");
                }
            });
            //后一张图
            $(".tq-tab.next-ques").unbind("click").bind("click", function () {
                if ($(this).hasClass("no-tabs")) return;
                var pic = pageFunc.picList[pageFunc.currentPicIndex];
                pageFunc.currentPicIndex++;
                //请求接口发送图片数据
                if (pageFunc.currentPicIndex <= pageFunc.picList.length - 1) {
                    //保存批改的图片
                    if (canvasFunc.isCurrentPicCorrected)
                    pageFunc.saveQuesImage(pic, pageFunc.loadImage);
                    else
                        pageFunc.loadImage();
                    $(".tq-tab.pre-ques").removeClass("no-tabs");
                }
                //按钮置灰
                if (pageFunc.currentPicIndex >= pageFunc.picList.length - 1) {
                    pageFunc.currentPicIndex = pageFunc.picList.length - 1;
                    $(this).addClass("no-tabs");
                }
            });
            //前一学生
            $(".stu-tab.pre-stu").unbind("click").bind("click", function () {
                var index = pageFunc.allStuList.indexOf(pageFunc.currentStuid);//获取当前所选学生在队列中的位置
                if (--index >= 0) {
                    pageFunc.doSubmit(); //提交学生答题批改
                    pageFunc.lastChangeStuFlag = -1;
                } else {
                    // ui.alert("已是第一个学生！", 2000);
                    $("body").tooltip("show", "已是第一个学生", {style: 'warning'});
                }
            });
            //后一学生
            $(".stu-tab.next-stu").unbind("click").bind("click", function () {
                var index = pageFunc.stuList.indexOf(pageFunc.currentStuid);//获取当前所选学生在队列中的位置
                if (++index <= pageFunc.stuList.length) {
                    pageFunc.doSubmit(); //提交学生答题批改
                    pageFunc.lastChangeStuFlag = 1;
                }
            });
        },

        /*判断数字中是否包含小数点，依此判断是否为小数*/
        hasDot: function (num) {
            if (isNaN(num)) return false;
            return (num + "").indexOf(".") > 0;
        },

        /*校验文本框输入*/
        checkScoreInput: function () {
            var container = $(".mark-float-window").is(":hidden") ? $(".main-right-content") : $(".mark-float-window");
            var input = $('.item-box-line .item-box-title input.cur_focus', container).focusout();
            var fullscore = parseFloat($(input).data("fullscore"));
            var score = $(input).val();
            var oldLength = score.length;
            //小数保留小数点后一位，不能用toFixed，会四舍五入
            if (pageFunc.hasDot(score))
                score = score.substr(0, score.indexOf('.') + 3);
            if (score.length < oldLength)
                $("body").tooltip("show", "只可保留小数点后两位！");
            score = parseFloat(score);
            //验证是否是空值导致的NaN转换
            if (isNaN(score))
                score = parseFloat($(input).data("score"));
            var optid = $(input).data("optid");
            if (score > fullscore) $("body").tooltip("show", "超出本题得分，清空后可重新输入！");
            $(".item-box input[data-optid=" + optid + "]").siblings().removeClass("cur");
            if (score >= fullscore) {
                $(".item-box input[data-optid=" + optid + "]").val(fullscore);
                $(".item-box input[data-optid=" + optid + "]").siblings(".item-right").addClass("cur");
            } else if (score == 0) {
                $(".item-box input[data-optid=" + optid + "]").val(0);
                $(".item-box input[data-optid=" + optid + "]").siblings(".item-wrong").addClass("cur");
            } else {
                $(".item-box input[data-optid=" + optid + "]").val(score);
                $(".item-box input[data-optid=" + optid + "]").siblings(".item-half").addClass("cur");
            }
            pageFunc.handleRightAndWrongIcon();
        },

        /*校验大题文本框输入*/
        checkMainScoreInput: function () {
            var input = $('.subject-box .subject-box-top input.cur_focus').focusout();
            var fullscore = parseFloat(pageFunc.quesInfo.fullscore);
            var score = $(input).val();
            var oldLength = score.length;
            //小数保留小数点后一位，不能用toFixed，会四舍五入
            if (pageFunc.hasDot(score))
                score = score.substr(0, score.indexOf('.') + 3);
            if (score.length < oldLength)
                $("body").tooltip("show", "只可保留小数点后两位！");
            score = parseFloat(score);
            //验证是否是空值导致的NaN转换
            if (isNaN(score))
                score = parseFloat($(input).data("score"));
            var optid = $(input).data("optid");
            if (score > fullscore) $("body").tooltip("show", "超出本题得分，清空后可重新输入！");
            $(".subject-box .subject-box-top a").siblings().removeClass("cur");
            if (score >= fullscore) {
                $(".subject-box .subject-box-top input[data-optid=" + optid + "]").val(fullscore);
                $(".subject-box .subject-box-top a").siblings(".all-right").addClass("cur");
            } else if (score == 0) {
                $(".subject-box .subject-box-top input[data-optid=" + optid + "]").val(0);
                $(".subject-box .subject-box-top a").siblings(".all-wrong").addClass("cur");
            } else {
                $(".subject-box .subject-box-top input[data-optid=" + optid + "]").val(score);
                $(".subject-box .subject-box-top a").siblings(".all-half").addClass("cur");
            }
        },

        /*在某个文本框获取焦点时，验证未输入分数的打分框，将其值设为当题所得分数*/
        checkNoScoreInput: function () {
            $.each($(".item-box input").not(".cur_focus"), function (index, item) {
                if ($(item).val() == "") {
                    var score = parseFloat($(item).data("score"));
                    var fullscore = parseFloat($(item).data("fullscore"));
                    $(item).val(score);
                    $(item).siblings("a").removeClass("cur");
                    if (score == fullscore)
                        $(item).siblings(".item-right").addClass("cur");
                    else if (score == 0)
                        $(item).siblings(".item-wrong").addClass("cur");
                    else
                        $(item).siblings(".item-half").addClass("cur");
                    pageFunc.handleRightAndWrongIcon();
                    pageFunc.calcTotalScore();
                }
            });
        },

        /*计算总分*/
        calcTotalScore: function () {
            var totalScore = 0;
            $.each($(".main-right-content .item-box input"), function (index, item) {
                var score = $(item).val();
                if (score == "")
                    score = $(item).data("score");
                totalScore += parseFloat(score);
            });
            $(".subject-box input").val(totalScore);
        },

        /*处理对错按钮选中*/
        handleRightAndWrongIcon: function () {
            if ($(".item-wrong.cur").length == 0 && $(".item-half.cur").length == 0) {
                $(".all-wrong").removeClass("cur");
                $(".all-half").removeClass("cur");
                $(".all-right").addClass("cur");
            }
            else if ($(".item-right.cur").length == 0 && $(".item-half.cur").length == 0) {
                $(".all-right").removeClass("cur");
                $(".all-half").removeClass("cur");
                $(".all-wrong").addClass("cur");
            }
            else if ($(".item-right.cur").length == 0 && $(".item-wrong.cur").length == 0) {
                $(".all-right").removeClass("cur");
                $(".all-wrong").removeClass("cur");
                $(".all-half").addClass("cur");
            }
            else if ($(".item-right.cur").length != 0 && $(".item-wrong.cur").length != 0 && $(".item-half.cur").length != 0) {
                $(".all-wrong").removeClass("cur");
                $(".all-right").removeClass("cur");
                $(".all-half").removeClass("cur");
            }
        },

        /*绑定打分板相关事件*/
        bindScoreBoardEvent: function () {
            //小题input获得焦点，显示该题详细打分板，隐藏其他详细打分板
            $('.item-box-line .item-box-title input').unbind("focus").bind("focus", function () {
                $(this).parents('.item-box').find('.item-box-title input').removeClass('cur_focus');
                $(this).addClass('cur_focus');
                $(this).val('');//清空文本框的值
                //判断打开打分板选项是否勾选
                if ($('.dgb-display').is('.select')) {
                    $(this).parents('.item-box').find('.detail-grade-board').slideUp();
                    $(this).parents('.item-box-line').find('.detail-grade-board').slideDown();
                }
                ;
                pageFunc.handleQuesImageChange($(this).data("optid"));  //切换小题答题图片
                pageFunc.checkNoScoreInput();//处理未输入分数的打分框
            });

            //绑定输入限制，函数定义在utils.js
            $('.item-box-line .item-box-title input').numcheck();
            $('.subject-box .subject-box-top input').numcheck();

            //分数输入完成后校验
            $('.item-box-line .item-box-title input').unbind("blur").bind("blur", function () {
                //处理最后一位不能是小数点和值非法时显示已得分
                if ($(this).val().lastIndexOf(".") == ($(this).val().length - 1)) {
                    $(this).val($(this).val().substr(0, $(this).val().length - 1));
                }
                if (isNaN($(this).val())) {
                    $(this).val($(this).data("score"));
                }
                $(this).data("modified", "1"); //更新修改标识
                if ($(this).val() != "") {
                    //校验分数
                    pageFunc.checkScoreInput();
                    pageFunc.calcTotalScore();
                }
            });

            //大题input获得焦点，显示该题详细打分板，隐藏其他详细打分板
            $('.subject-box .subject-box-top input').unbind("focus").bind("focus", function () {
                $(this).parents('.subject-box').find('.subject-box-top input').removeClass('cur_focus');
                $(this).addClass('cur_focus');
                $(this).val("");
                //判断打开打分板选项是否勾选
                if ($('.dgb-display').is('.select')) {
                    $(this).parents('.subject-box').siblings('.detail-grade-board').slideDown();
                }
                ;
            });

            //大题input输入完成后校验
            $('.subject-box .subject-box-top input').unbind("blur").bind("blur", function () {
                //处理最后一位不能是小数点和值非法时显示已得分
                if ($(this).val().lastIndexOf(".") == ($(this).val().length - 1)) {
                    $(this).val($(this).val().substr(0, $(this).val().length - 1));
                }
                if (isNaN($(this).val())) {
                    $(this).val($(this).data("score"));
                }
                $(this).attr("data-modified", "1").data("modified", "1"); //更新修改标识
                if ($(this).val() != "")
                    pageFunc.checkMainScoreInput(); //校验分数
            });

            //小题分数确定或取消后，关闭详细打分板，退除样式
            $('.item-box-title a').unbind("click").bind("click", function () {
                //判断打开打分板选项是否勾选
                if ($('.dgb-display').is('.select')) {
                    $(this).parents('.item-box-line').find('.item-box-title input').removeClass('cur_focus');
                    $(this).parents('.item-box-line').find('.detail-grade-board').slideUp();
                }
                ;
            });

            //详细打分板分数选择
            $('.dgb-content li').unbind("click").bind("click", function () {
                $('.dgb-content li').removeClass('li_cur');
                $(this).addClass('li_cur');
                var optid = $(".li_cur").parents(".detail-grade-board").data("optid");
                var key_value = $(this).html();
                if (isNaN(key_value) && key_value != '.') {
                    $("input[data-optid=" + optid + "]").val('');//清空
                } else {
                    if (key_value == '.5' && pageFunc.hasDot($("input[data-optid=" + optid + "]").val())) {
                        return; //已存在小数点或值为空时不可输入.
                    }
                    var currentInput = $("input[data-optid=" + optid + "]", $(this).parents(".detail-grade-board").siblings());
                    if (currentInput.data("modified") == "0") {
                        $("input[data-optid=" + optid + "]").val("");
                        currentInput.data("modified", "1");
                    }
                    $("input[data-optid=" + optid + "]").val(currentInput.val() + key_value);//数字和.


                    if (pageFunc.quesInfo.iscorrect == 0) {
                        pageFunc.checkScoreInput();
                        pageFunc.calcTotalScore();
                    } else {
                        pageFunc.checkMainScoreInput();
                    }
                }
            });

            //小题对
            $('.item-box-title .item-right').unbind("click").bind("click", function () {
                $.each($(".item-right[data-optid=" + $(this).data("optid") + "]"), function (index, item) {
                    $("a", $(item).parent()).removeClass("cur");
                    $(item).addClass("cur");
                    var input = $(item).siblings("input");
                    input.val(input.data("fullscore"));
                });
                pageFunc.handleRightAndWrongIcon();
                pageFunc.calcTotalScore();
            });

            //小题半对
            $('.item-box-title .item-half').unbind("click").bind("click", function () {
                $.each($(".item-half[data-optid=" + $(this).data("optid") + "]"), function (index, item) {
                    $("a", $(item).parent()).removeClass("cur");
                    $(item).addClass("cur");
                    var input = $(item).siblings("input");
                    input.val(parseInt(input.data("fullscore")) / 2);
                });
                pageFunc.handleRightAndWrongIcon();
                pageFunc.calcTotalScore();
            });

            //小题错
            $('.item-box-title .item-wrong').unbind("click").bind("click", function () {
                $.each($(".item-wrong[data-optid=" + $(this).data("optid") + "]"), function (index, item) {
                    $("a", $(item).parent()).removeClass("cur");
                    $(item).addClass("cur");
                    var input = $(item).siblings("input");
                    input.val("0");
                });
                pageFunc.handleRightAndWrongIcon();
                pageFunc.calcTotalScore();
            });

            //全对
            $('.subject-box .subject-box-bottom .all-right').unbind("click").bind("click", function () {
                $(".all-wrong").removeClass("cur");
                $(".all-right").addClass("cur");
                $(".all-half").removeClass("cur");
                $(".item-box a").removeClass("cur");
                $(".item-box a.item-right").addClass("cur");
                $.each($(".item-box input"), function (index, item) {
                    $(item).val($(item).data("fullscore"));
                });
                $(".subject-box input").val(pageFunc.quesInfo.fullscore);//总分栏显示满分
            });

            //全错
            $('.subject-box .subject-box-bottom .all-wrong').unbind("click").bind("click", function () {
                $(".all-right").removeClass("cur");
                $(".all-wrong").addClass("cur");
                $(".all-half").removeClass("cur");
                $(".item-box a").removeClass("cur");
                $(".item-box a.item-wrong").addClass("cur");
                $(".item-box input").val("0");
                $(".subject-box input").val("0");//总分栏显示0分
            });

            //半对
            $('.subject-box .subject-box-bottom .all-half').unbind("click").bind("click", function () {
                $(".all-wrong").removeClass("cur");
                $(".all-right").removeClass("cur");
                $(".all-half").addClass("cur");
                $(".item-box a").removeClass("cur");
                $(".item-box a.item-half").addClass("cur");
                $.each($(".item-box input"), function (index, item) {
                    $(item).val($(item).data("fullscore") / 2);
                });
                $(".subject-box input").val(pageFunc.quesInfo.fullscore / 2);//总分栏显示满分/2
            });

            pageFunc.initFloatScoreBoard();
        },

        /*初始化浮动打分板事件*/
        initFloatScoreBoard: function () {
            var obj = $(".mark-float-window")[0];
            rDrag.init(obj);
        },

        /*处理页面元素是否禁用，用于提交后新题数据加载完成前的UI处理*/
        handleEventEnable: function (isEnabled) {
            if (isEnabled) {
                $(".subject-box input,.item-box input").removeAttr("disabled");
            } else {
                $(".subject-box input,.item-box input").attr("disabled", "disabled");
                $(".all-right,.all-wrong,.item-right,.item-wrong").attr("disabled", "disabled");
            }
        },

        /*初始化题目附加属性*/
        initQuesState: function () {
            pageFunc.isRight = 0;            //大题是否正确，如果是按小题批改，小题全对为1，全错为0，其他为-1;
            //重置切图按钮状态
            $(".tq-tab.pre-ques").addClass("no-tabs");
            $(".tq-tab.next-ques").removeClass("no-tabs");
        },

        /*初始化批改页面数据数据*/
        initCorrectData: function (json) {
            if (json == "") {
                pageFunc.backToWorkList();
                return;
            }
            var data = JSON.parse(json);
            data = data.data ? data.data : data;//内存缓存数据与接口返回数据不一致，做出区分
            pageFunc.isSubmitting = false;
            pageFunc.handleEventEnable(true);
            $('.zoom-op-top a.restore').trigger("click");//触发一次还原按钮点击事件，重置旋转、缩放和位移
            pageFunc.correctData = data;  //保存当前题目批改信息对象
            pageFunc.currentStuid = pageFunc.correctData.shwid; //当前批改学生id
            //根据调用的接口，获取题目信息
            if (!isNullOrUndefined(pageFunc.correctData.first))
                pageFunc.quesData = pageFunc.correctData.first;
            else
                pageFunc.quesData = pageFunc.correctData;

            //获取题目详细信息
            pageFunc.quesInfo = pageFunc.quesData.queslist[0];
            //根据大小题进入类型，获取当前题目的id
            if (pageFunc.quesInfo.iscorrect == 1 && pageFunc.quetype == 0){
                pageFunc.queid = pageFunc.quesInfo.mainid;
            }
            else {
                pageFunc.queid = pageFunc.quesInfo.queschilds[0].optionid;
                pageFunc.quepid = pageFunc.quesInfo.mainid;
            }
            //初始化一些成员变量值
            pageFunc.initQuesState();
            if(pageFunc.isrevise=="0")
                pageFunc.initWorkHintState();

            //根据调用接口，选择初始化题目和学生下拉列表，需要依赖quepid，所以不可以和上面的判断合并
            if (typeof (pageFunc.correctData.first) != 'undefined') {
                pageFunc.initStudentList(pageFunc.correctData.list); //调用correctStudentlistbyfirst接口表示切换大题，需要加载答题学生下拉列表
            } else {
                $(".exe-student-list ul li[data-shwid=" + pageFunc.currentStuid + "]").addClass("cur").siblings("li").removeClass("cur");
                $(".exe-student-list ul").parent().siblings(".stu-title").find("label").html($(".exe-student-list ul li.cur .list-line .list-stuname").html());
            }

            //判断当前题型，并显示对应的批改区域
            if (pageFunc.quesInfo.typeid == "3" || pageFunc.quesInfo.typeid == "6") {
                //大于一张显示图片切换按钮，否则隐藏
                if ((pageFunc.quesData.picpathlist.length > 1 && pageFunc.isrevise==0) || (pageFunc.quesData.revisepicpathlist.length>1 && pageFunc.isrevise!=0)) {
                    $(".tq-tab").show();
                } else {
                    $(".tq-tab").hide();
                }
                pageFunc.initPicPathList(); //初始化图片列表
                pageFunc.picQuesDiv.show();
            }
            pageFunc.initScoreBoard();
            pageFunc.calcAvgInfo();
            pageFunc.loadImage();
        },
        initWorkHintState:function () {
            var isrevise = 0;
            var evastate = 0;
            //根据大小题进入类型，获取当前题目的id
            if (pageFunc.quesInfo.iscorrect == 1 && pageFunc.quetype == 0){
                isrevise = pageFunc.quesInfo.isrevise;
                evastate = pageFunc.quesInfo.evastate;
            }
            else {
                isrevise = pageFunc.quesInfo.queschilds[0].isrevise;
                evastate = pageFunc.quesInfo.queschilds[0].evastate;
            }
            if(isrevise == 1){
                $(".test-questions-box .tqb-hint").show();//显示订正
                $(".zoom-draw-box .iscorrect").addClass("cur");
                pageFunc.isUnSwitchRevise = true;
            }
            else{
                $(".test-questions-box .tqb-hint").hide();
                $(".zoom-draw-box .iscorrect").removeClass("cur");
                pageFunc.isUnSwitchRevise = false;
            }
            $(".test-questions-box .well-hint").hide();
            $(".test-questions-box .wrong-hint").hide();
            $(".zoom-draw-box .isWell").removeClass("cur");
            $(".zoom-draw-box .isWrong").removeClass("cur");
            //优秀作答
            if(evastate == "1"){
                $(".zoom-draw-box .isWell").addClass("cur");
                $(".test-questions-box .well-hint").show();
            }else if(evastate == "2"){
                $(".zoom-draw-box .isWrong").addClass("cur");
                $(".test-questions-box .wrong-hint").show();
            }
        },

        /*完成率和平均分统计*/
        calcAvgInfo: function () {
            $(".exercises-info .correct-count").html(pageFunc.completeCount);
            $(".exercises-info .total-count").html(pageFunc.totalCount);
            var totalScore = pageFunc.getAllStuTotalScore();
            var avgScore = pageFunc.completeCount == 0 ? 0 : parseFloat(totalScore / pageFunc.completeCount).toFixed(2);
            $(".exercises-info .avg").html(avgScore);
        },

        /*计算总分*/
        getAllStuTotalScore: function () {
            var total = 0;
            $.each($(".exe-student-list ul li .list-type.fs"), function (index, item) {
                total += parseFloat($(item).data("score"));
            });
            return total;
        },

        /*初始化学生下拉列表内容*/
        initStudentList: function (data) {
            var unCorrectCount = 0;
            pageFunc.stuList = [];
            pageFunc.allStuList = [];
            var unCorrectList = [];
            var correctList = [];
            var stuSelectList=[];
            data.forEach(function (item) {
                //select2 数据源
                stuSelectList.push({
                    id:item.shwid,
                    text:item.name,
                    score:item.score,
                    iscom:item.iscom,
                    iploadid:item.shwid + pageFunc.queid
                });
                //将未批改的学生放入列表，用于切换，重批时所有学生都要放入  订正状态下 iscom=0 为未订正
                if (item.iscom == 0 && pageFunc.isrevise=="0"){
                    unCorrectList.push(item.shwid);
                    unCorrectCount++;
                }else{
                    correctList.push(item.shwid);
                }
                pageFunc.allStuList.push(item.shwid);
            });
            pageFunc.stuList = unCorrectList.length == 0 ? correctList : unCorrectList;
            pageFunc.totalCount = data.length;
            pageFunc.completeCount = pageFunc.totalCount - unCorrectCount;
            var list_container = $(".exercises-student .list");
            list_container.off().empty().select2({
                width:"100%",
                height:"100%",
                initSelection:function (ele,cb) {
                    var id= pageFunc.currentStuid;
                    var text=$("option[value="+ pageFunc.currentStuid+"]",list_container).text();
                    cb({id:id,text:text});
                },
                //select2 option显示内容
                templateResult: function (state) {
                    if (!state.id) return state.text;
                    $(state.element).data("shwid",state.id);
                    $(state.element).data("score",state.score);
                    $(state.element).data("uploadid",state.uploadid);

                    var html = '<div class="list-line" data-shwid="' + state.id + '><span class="list-stuname">' + state.text + '</span>';
                    if (state.iscom == 1) {
                        if(pageFunc.isrevise!="1")
                            html += '<span class="list-type fs" data-score="' + state.score + '" data-uploadid="' + (state.id + pageFunc.queid) + '">' + state.score + '分</span>';
                    } else {
                        if(pageFunc.isrevise=="1")
                            html += '<span class="list-type wpg">待订正</span>';
                        else
                            html += '<span class="list-type wpg" data-uploadid="' + (state.id + pageFunc.queid) + '">未批改</span>';
                    }
                    html += '</div>';
                    return $(html);
                },
                data: stuSelectList
            });

            list_container.on('change', function () {
                pageFunc.currentStuid = $(this).children('option:selected').val();
                pageFunc.getStuQueDetails();//获取所选学生答题信息
            });
            list_container.val(pageFunc.currentStuid).attr("aria-selected",true);
        },

        /*请求接口获取题目列表*/
        loadQuestionList: function () {
            pageFunc.queid = "";
            cef.message.sendMessage('micro.jsMsgExecFunc', ['correctWorkbyQue', '&workId=' + pageFunc.workid +'&isRevise='+pageFunc.isrevise]);
        },

        /*初始化题目下拉列表内容*/
        initQuestionList: function (json) {
            var data = JSON.parse(json);
            if (data.code != 1) {
                return;
            }
            data = data.data;
            for (var i = 0; i < data.length; i++) {
                if (pageFunc.classid == data[i].classid) {
                    pageFunc.quesList = data[i].queslist;
                }
            }
            pageFunc.quesList.forEach(function (value) {
                if(value.iscorrect == 0){
                    var child=value.childs[0];
                    value.title =  value.title+"-"+child.quesort;
                    value.queid = child.queid;
                    value.type = 1;
                }
            });
            pageFunc.loadQuestionHtml();
        },

        /*初始化答案图片列表*/
        initPicPathList: function () {
            pageFunc.picList = [];
            pageFunc.oldPicList = [];
            pageFunc.currentPicIndex = 0;
            var picList=[];
            var revisePicList = [];
            //批阅图片
            $.each(pageFunc.quesData.picpathlist, function (index, item) {
                var pic = {};
                pic.name = item.oldsource.indexOf("nopicture") == -1 ? pageFunc.getImgFileName(item.oldsource) : "";   //id为0时，显示该学生未提交答案之类的提示语
                pic.optid = item.optionId == "" ? item.mainid : item.optionId;   //对应的题目id
                pic.id = item.id;
                pic.oldPath = item.oldsource;
                pic.path = item.source;
                pic.index = index;
                pic.restype = item.restype;
                picList.push(pic);
            });
            //订正图片
            $.each(pageFunc.quesData.revisepicpathlist, function (index, item) {
                var pic = {};
                pic.name = item.oldsource.indexOf("nopicture") == -1 ? pageFunc.getImgFileName(item.oldsource) : "";   //id为0时，显示该学生未提交答案之类的提示语
                pic.optid = item.optionId == "" ? item.mainid : item.optionId;   //对应的题目id
                pic.id = item.id;
                pic.oldPath = item.oldsource;
                pic.path = item.source;
                pic.index = index;
                pic.restype = item.restype;
                revisePicList.push(pic);
            });
            if(pageFunc.isrevise == 1){
                pageFunc.picList = revisePicList;
                pageFunc.oldPicList = picList;
            }else{
                pageFunc.picList =  picList;
            }
        },

        /*根据图片地址获取图片文件名*/
        getImgFileName: function (path) {
            path = path.substr(path.lastIndexOf('/') + 1);
            if (path.indexOf('?') > -1)
                path = path.substr(0, path.indexOf('?'));
            return path;
        },

        /*初始化打分板*/
        initScoreBoard: function () {
            var mainInput = $(".subject-box input"); //大题分数输入框
            var op_container = $(".item-box");  //小题列表容器
            $(".subject-box-top .sub-num").html(pageFunc.quesInfo.list_maintitle);//大题题号
            $('.fullGrad').text('(满分' + pageFunc.quesInfo.fullscore + '分)');
            mainInput.val(pageFunc.quesInfo.score);
            $(".detail-grade-board").hide();//隐藏大题分数框的2个小键盘，避免切到小题时依然显示

            $(".sub-num").attr("data-optid", pageFunc.quesInfo.mainid).data("optid", pageFunc.quesInfo.mainid);
            //判断批改方式:1为大题批改，0为小题批改
            if (pageFunc.quesInfo.iscorrect == 1) {
                $(".subject-box-top .sub-num").html(pageFunc.quesInfo.list_maintitle + '(满分' + pageFunc.quesInfo.fullscore + '分)');//大题题号
                op_container.hide();
                // mainInput.attr("placeholder", "满分" + pageFunc.quesInfo.fullscore + "分");
                mainInput.attr("placeholder", "满分" + pageFunc.quesInfo.fullscore + "分");
                $('.fullGrad').hide();
                $('.getScore').hide();
                mainInput.css({
                    'width': '100%',
                    'textAlign': 'left',
                    'paddingLeft': '10px',
                    'height': '45px',
                    'border': '2px solid #DCE0EC'
                });

                mainInput.attr("data-optid", pageFunc.quesInfo.mainid).data("optid", pageFunc.quesInfo.mainid);
                mainInput.attr("data-fullscore", pageFunc.quesInfo.fullscore).data("fullscore", pageFunc.quesInfo.fullscore);
                mainInput.attr("data-score", pageFunc.quesInfo.score).data("score", pageFunc.quesInfo.score);
                mainInput.attr("data-modified", "0").data("modified", "0"); //初始化文本框修改状态
                $(".detail-grade-board.main-board").attr("data-optid", pageFunc.quesInfo.mainid).data("optid", pageFunc.quesInfo.mainid);
                $(".subject-box").show();
            } else {
                mainInput.attr("disabled", "disabled"); //小题批改时，大题分数框只显示，不可点击和输入
                mainInput.removeClass("cur_focus");
                op_container.empty();
                $('.fullGrad').show();
                $('.getScore').show();
                mainInput.css({
                    'width': '30',
                    'textAlign': 'center',
                    'paddingLeft': '0px',
                    'height': '30px',
                    'border': 'none'
                });
                $.each(pageFunc.quesInfo.queschilds, function (index, item) {
                    op_container.append(pageFunc.getOpListItem(index, item));
                });
                op_container.show();
                $(".subject-box").hide();
            }
            //绑定打分板事件
            pageFunc.bindScoreBoardEvent();

            //按小题批改，根据小题分数计算大题总分
            if (pageFunc.quesInfo.iscorrect == 0) {
                pageFunc.calcTotalScore();
                var wrongCount = $(".main-right-content .item-box .item-wrong.cur").length;
                var rightCount = $(".main-right-content .item-box .item-right.cur").length;
                var halfCount = $(".main-right-content .item-box .item-half.cur").length;
                if (rightCount == pageFunc.quesInfo.queschilds.length) {
                    $(".all-wrong").removeClass("cur");
                    $(".all-half").removeClass("cur");
                    $(".all-right").addClass("cur");
                } else if (wrongCount == pageFunc.quesInfo.queschilds.length) {
                    $(".all-wrong").addClass("cur");
                    $(".all-half").removeClass("cur");
                    $(".all-right").removeClass("cur");
                }
                else if (halfCount == pageFunc.quesInfo.queschilds.length) {
                    $(".all-wrong").removeClass("cur");
                    $(".all-half").addClass("cur");
                    $(".all-right").removeClass("cur");
                }
            } else {
                if (mainInput.data("score") == mainInput.data("fullscore")) {
                    $(".all-wrong").removeClass("cur");
                    $(".all-right").addClass("cur");
                    $(".all-half").removeClass("cur");
                } else if (mainInput.data("score") == 0) {
                    $(".all-right").removeClass("cur");
                    $(".all-wrong").addClass("cur");
                    $(".all-half").removeClass("cur");
                } else {
                    $(".all-wrong").removeClass("cur");
                    $(".all-right").removeClass("cur");
                    $(".all-half").addClass("cur");
                }
            }
            //设置默认的分数框获取焦点
            pageFunc.setDefaultScoreInput(false, "");
        },

        /*设置默认的分数框获取焦点，显示小键盘，如果传递optid，则根据optid定位（用于浮动和主打分板切换）*/
        setDefaultScoreInput: function (isFocus, optid) {
            var container = $(".mark-float-window").is(":hidden") ? $(".main-right-content") : $(".mark-float-window");
            var target = null;
            var numBoard = null; //对应的软键盘
            //寻找目标文本框
            if (pageFunc.quesInfo.iscorrect == 0) {
                if (optid != "")
                    target = $(".item-box input[data-optid=" + optid + "]", container);
                else
                    target = $(".item-box input", container).first();
                numBoard = target.parent().siblings();
            } else {
                if (optid != "")
                    target = $(".subject-box-top input[data-optid=" + optid + "]", container);
                else
                    target = $(".subject-box-top input", container).first();
                numBoard = target.parent().parent().siblings(".main-board");
            }
            //处理是否设置焦点
            if (isFocus) {
                target.focusout().focus();
            } else {
                $(".detail-grade-board", container).hide();
                $(".item-box input", container).removeClass("cur_focus");
                target.addClass("cur_focus");
                if ($('.dgb-display').is(".select"))
                    numBoard.slideDown();
            }
        },
        loadClassHtml:function (data) {
            var list_container = $(".exercises-name .list");
            list_container.off().empty().select2({
                minimumResultsForSearch: -1,
                width:'100%',
                height:'100%',
                templateResult: function (state) {
                    if (!state.id) return state.text;
                    var html = '<div class="list-line"><span class="list-classname">' + state.text + '</span>';
                    if (state.count !=0 ) {
                        if(pageFunc.isrevise == "1")
                            html += '<span class="list-type">'+state.count+'人</span>';
                        else
                            html += '<span class="list-type dpg">'+state.count+'人待批</span>';
                    }
                    html += '</div>';
                    return $(html);
                },
                data: data,
            });

            list_container.on('change', function () {
                pageFunc.classid= $(this).children('option:selected').val();
                pageFunc.loadQuestionList();
            });
            list_container.val(pageFunc.classid).trigger("change");
        },
        loadQuestionHtml:function () {
            var queList = [];
            pageFunc.quesList.forEach(function (item) {
                //select2 title属性暂存type
                queList.push({id:item.queid,text:item.title,title:item.type});
                if ((item.total - item.end == 0) && pageFunc.recorrectList.indexOf(item.queid) == -1) {
                    pageFunc.recorrectList.push(item.queid);
                }
            })

            var list_container = $(".exercises-number .list");
            list_container.off().empty().select2({
                minimumResultsForSearch: -1,
                width:"100%",
                height:"100%",
                templateResult: function (state) {
                    if (!state.id) return state.text;
                    $(state.element).data("quetype",state.type);
                    return $("<a data-queid='" + state.id + "' data-quetype='" + state.type + "' title='" + state.text + "'>" + state.text + "</a>");
                },
                data: queList
            });

            list_container.on('change', function () {
                pageFunc.quetype = $(this).select2("data")[0].title;
                pageFunc.queid = $(this).select2("data")[0].id;
                var param = '&workId=' + pageFunc.workid + '&queId=' + pageFunc.queid + '&queType=' + pageFunc.quetype + '&classId=' + pageFunc.classid+'&isRevise='+pageFunc.isrevise;
                cef.message.sendMessage('micro.jsMsgExecFunc', ['correctStudentlistbyfirst', param]);
            });
            list_container.val(pageFunc.queid).trigger("change");
        },

        /*获取小题列表项*/
        getOpListItem: function (index, item) {
            var right_class = item.fullscore == item.score ? 'cur' : '';
            var half_class = (item.score != item.fullscore && item.score != 0) ? 'cur' : '';
            var wrong_class = item.score == 0 ? 'cur' : '';
            var html = '<div class="item-box-line"><div class="item-box-title"><span class="item-num" data-optid="' + item.optionid + '">第' + item.sortorder + '小题 (满分' + item.fullscore + '分)</span>';
            html += '<a href="javascript:void(0)" class="item-right ' + right_class + '" data-optid="' + item.optionid + '"></a>' +
                '<a href="javascript:void(0)" class="item-half ' + half_class + '" data-optid="' + item.optionid + '"></a>' +
                '<a href="javascript:void(0)" class="item-wrong ' + wrong_class + '" data-optid="' + item.optionid + '"></a>';
            html += '<input type="text" placeholder="满分' + item.fullscore + '分" data-index="' + index + '" data-optid="' + item.optionid + '" data-fullscore="' + item.fullscore + '" data-score="' + item.score + '" data-modified="0" value="' + item.score + '" /></div>';

            if (pageFunc.quesInfo.typeid == "5")
                html += '<div class="item-cp-s"><span>测评分:<label>' + item.audioscore + '</label></span></div>';
            html += pageFunc.getNumBoardItem(item.optionid);
            html += '</div>';
            return html;
        },

        /*插入一块数字软键盘内容*/
        getNumBoardItem: function (optid) {
            var html = '<div class="detail-grade-board" data-optid="' + optid + '" style="display: none;"><div class="dgb-title"><span>软键盘</span></div>';
            html += '<div class="dgb-content"><ul><li>7</li><li>8</li><li>9</li><li>4</li><li>5</li><li>6</li><li>1</li><li>2</li><li>3</li><li>.5</li><li>0</li><li style="font-size: 22px">清空</li></ul></div></div>';
            return html;
        },

        /*显示隐藏无图片提示层，启用或禁用canvas写画工具栏*/
        showNoPicDiv: function (isShow) {
            if (isShow) {
                canvasFunc.clear();//清空笔迹
                canvasFunc.currentState = canvasFunc.opt_stat.disabled;//禁止写画
                pageFunc.noPicDiv.show();
                if(pageFunc.isrevise == "1")
                    pageFunc.noPicDiv.find("span").text("该学生尚未订正");
                pageFunc.isCanvasNotReady = true;
            } else {
                pageFunc.noPicDiv.hide();
                pageFunc.isCanvasNotReady = false;
            }
        },

        /*根据传递的base64加载图片*/
        loadQuesImage: function (data) {
            if (data == "nopicture") {
                pageFunc.loadingDiv.hide();
                //无提交图片
                pageFunc.showNoPicDiv(true);
                return;
            } else if (data == "") {
                pageFunc.loadingDiv.hide();
                //base64加载失败
                pageFunc.loadFailedDiv.show();
                return;
            }
            var canvasImg = $("#canvasImg")[0];
            var canvasPaint = $("#canvasPaint")[0];
            var img = new Image();
            img.src = 'data:image/png;base64,' + data;
            img.onload = function () {
                var box = $(".test-questions-box");
                var imgSize = pageFunc.calcImgWH(box.width(), box.height(), img.width, img.height);
                //设置画布宽高
                canvasImg.width = imgSize.w;
                canvasImg.height = imgSize.h;
                canvasPaint.height = imgSize.h;
                canvasPaint.width = imgSize.w;
                //初始化canvas操作
                canvasFunc.init(canvasImg, canvasPaint, img);
                canvasFunc.currentState = canvasFunc.opt_stat.pen;
                canvasFunc.clear();
                pageFunc.loadingDiv.hide();
                pageFunc.loadFailedDiv.hide();
                pageFunc.showNoPicDiv(false);
            };
        },
        calcImgWH: function (boxW, boxH, imgW, imgH) {
            if (boxW < imgW || boxH < imgH) {
                if (imgW / boxW > imgH / boxH) {
                    imgH = boxW / (imgW / imgH);
                    imgW = boxW;
                } else {
                    imgW = boxH / (imgH / imgW);
                    imgH = boxH;
                }
            }
            pageFunc.imgSize = {w: imgW, h: imgH};
            var top = (boxH - imgH) / 2;
            var left = (boxW - imgW) / 2;
            $("#canvasImg").css("margin", top + "px " + left + "px");
            $("#canvasPaint").css("margin", top + "px " + left + "px");
            return {w: imgW, h: imgH}
        },
        /*传递批改后的图片base64给C++端保存*/
        saveQuesImage: function (pic, cb) {
            if(canvasFunc.isCurrentPicCorrected){
                //标记图片批改完成上传 以图片name作为标示
                sessionStorage[pic.name] = true;
            }

            canvasFunc.isCurrentPicCorrected = false;//进入保存图片方法，将批改状态置false
            var paintBase64 = canvasFunc.canvasPaint.toDataURL();
            var img = new Image();
            img.src = paintBase64;
            img.onload = function () {
                canvasFunc.imgCtx.drawImage(img, 0, 0);
                var base64 = canvasFunc.canvasImg.toDataURL("image/jpeg");
                base64 = base64.substr(base64.indexOf(',') + 1);//去除图片格式前缀
                var path = pic.oldPath.substring("homework".length + 1, pic.oldPath.length);//截取homework c++上传至批改文件夹需要拼接后半部分数据
                base64 = path + '&' + base64; //拼接，加上图片名称
                cef.message.sendMessage('micro.jsMsgExecFunc', ['saveQuesImage', base64]);
                pageFunc.saveQuesImageCallback = cb;
            };
        },

        /*保存批改图片回调，此回调会在C++接收到saveQuesImage接口调用时立即回调，并不会等待保存完毕后再回调*/
        onQuesImageSaved: function () {
            if (!isNullOrUndefined(pageFunc.saveQuesImageCallback))
                pageFunc.saveQuesImageCallback();//执行相应的回调
        },

        /*调用接口获取学生答题数据*/
        getStuQueDetails: function () {
            var param = '&workId=' + pageFunc.workid + '&shwId=' + pageFunc.currentStuid + '&queId=' + pageFunc.queid + '&queType=' + pageFunc.quetype+"&isRevise="+pageFunc.isrevise;
            cef.message.sendMessage('micro.jsMsgExecFunc', ['getStuQueDetails', param]);
        },

        /*提交批改结果*/
        doSubmit: function () {
            if (pageFunc.isSubmitting) return;
            pageFunc.isSubmitting = true;
            pageFunc.handleEventEnable(false);
            pageFunc.loadingDiv.show();
            //处理回车键提交可能导致的文本框数据验证问题
            if (pageFunc.quesInfo.iscorrect == 0) {
                pageFunc.checkScoreInput();
                pageFunc.calcTotalScore();
            } else {
                pageFunc.checkMainScoreInput();
            }
            //如有未保存的批改图片，则需要保存
            var pic = pageFunc.picList[pageFunc.currentPicIndex];
            if (!pic || !canvasFunc.isCurrentPicCorrected)
                pageFunc.submitCorrectResult();
            else
                pageFunc.saveQuesImage(pic, pageFunc.submitCorrectResult);
        },

        /*提交批改结果*/
        submitCorrectResult: function () {
            var resultJson = pageFunc.getResultJson();
            // var resultJson = '{"lessonids":[],"IsShare":' + isShare + ',"IsCollection":' + isCollection + ',"AudioTime":0,"CommentAudio":"","Comment":"' + encodeURI(pageFunc.comment) + '",';
            // resultJson += '"picids":[' + pageFunc.getPicidsResult() + '],"ques":[' + pageFunc.getQuesResult() + ']}';
            if (!isNullOrUndefined(pageFunc.correctData.first))
                pageFunc.correctData.first = pageFunc.quesData;
            else
                pageFunc.correctData = pageFunc.quesData;
            localStorage.setItem(pageFunc.currentStuid + pageFunc.queid, pageFunc.quesInfo.score); //将提交学生的当题得分存在本地存储中，用于上传完毕回调时更新下拉列表分数及平均分
            var param = '&correctResult=' + JSON.stringify(pageFunc.correctData) + '&questitle=' + $(".exe-number-list").siblings(".que-title").html() + '&correctJson=' + resultJson + '&userId=' + localStorage.userId + '&shwId=' + pageFunc.currentStuid;
            cef.message.sendMessage('micro.jsMsgExecFunc', ['saveCorrectResultNew', param]);
        },
        getResultJson: function () {
            return '{"ques":[' + pageFunc.getQuesResult() + ']}';
        },
        getResSources: function (queId) {
            var result = '';
            $.each(pageFunc.picList, function (index, item) {
                if (item.optid == queId) {
                    var _source = item.oldPath;
                    if (sessionStorage[item.name] == "true")
                        _source = "homework/check" + _source.substring("homework".length, _source.length);
                    else
                        _source = item.path;
                    result += '{"resId":"' + item.id + '","resType":' + item.restype + ',"source":"' + _source + '","title":"' + item.name + '"},';
                }
            })
            if (result.length > 0)
                result = result.substr(0, result.length - 1);
            return result;
        },

        /*获取批改结果中的ques部分*/
        getQuesResult: function () {
            var mainid = pageFunc.quetype == 0 ? pageFunc.queid : pageFunc.quepid;
            var isRevise = pageFunc.quetype == 0 ? ',"isrevise":' + pageFunc.quesInfo.isrevise : '';
            var evastate = pageFunc.quetype == 0 ? ',"evastate":' + pageFunc.quesInfo.evastate : '';
            var result = '{"score":' + $(".main-right-content .subject-box input").val() + ',"mainid":"' + mainid + '",';
            result += '"iscorrect":' + pageFunc.quesInfo.iscorrect + isRevise+evastate+ ',"smallques":[' + pageFunc.getChildQuesResult() + '],"isright":' + pageFunc.isRight + ',"sources":[' + pageFunc.getResSources(mainid) + ']}';

            //更新批改结果的大题信息
            pageFunc.quesData.queslist[0].score = parseFloat($(".main-right-content .subject-box input").val());
            pageFunc.quesData.queslist[0].isright = pageFunc.isRight;
            return result;
        },

        /*获取小题批改结果*/
        getChildQuesResult: function () {
            var result = '';
            var wrongCount = 0;
            if (pageFunc.quesInfo.iscorrect == 0 || (pageFunc.quesInfo.iscorrect == 1 && pageFunc.quesInfo.isphoto == 0)) {
                //按小题批改或按大题给分小题拍照，获取小题答题详情
                for (var i = 0; i < pageFunc.quesInfo.queschilds.length; i++) {
                    var item = pageFunc.quesInfo.queschilds[i];
                    var isRevise = pageFunc.quetype == 1 ? ',"isrevise":' + item.isrevise : '';
                    var evastate = pageFunc.quetype == 1 ? ',"evastate":' + item.evastate : '';
                    var isright = $(".main-right-content .item-right[data-optid=" + item.optionid + "]").is(".cur") || pageFunc.quesInfo.iscorrect == 1 ? 1 : 0;
                    var score = pageFunc.quesInfo.iscorrect == 1 ? item.score : $(".main-right-content .item-box input[data-optid=" + item.optionid + "]").val();
                    result += '{"score":' + score + isRevise+evastate+',"iscorrect":' + pageFunc.quesInfo.iscorrect + ',"opid":"' + item.optionid + '","isright":' + isright + ',"sources":[' + pageFunc.getResSources(item.optionid) + ']},';
                    if (isright == 0)
                        wrongCount++;
                    //更新批改结果的小题信息
                    pageFunc.quesData.queslist[0].queschilds[i].score = parseFloat(score);
                    pageFunc.quesData.queslist[0].queschilds[i].isright = isright;
                }
                //设置大题的对错
                if (wrongCount == 0)
                    pageFunc.isRight = 1;
                else if (wrongCount == pageFunc.quesInfo.queschilds.length)
                    pageFunc.isRight = 0;
                else
                    pageFunc.isRight = -1;
            } else {
                //按大题批改，获取大题对错
                if (parseFloat($(".main-right-content .subject-box input").val()) == pageFunc.quesInfo.fullscore)
                    pageFunc.isRight = 1;
                else
                    pageFunc.isRight = 0;
            }
            if (result.length > 0)
                result = result.substr(0, result.length - 1);
            return result;
        },

        /*提交结果完成回调*/
        onSubmitCompleted: function () {
            var index = 0;
            var param = "";
            if (pageFunc.lastChangeStuFlag >= 0) {
                //继续加载后一个学生答题情况
                index = pageFunc.stuList.indexOf(pageFunc.currentStuid);//获取当前所选学生在队列中的位置
                if (pageFunc.recorrectList.indexOf(pageFunc.queid) != -1) {
                    pageFunc.stuList.splice(index, 1);//非重批题目，将当前已批改过的学生id从未批改学生列表中删除
                    index--;//配合下面的自增，避免移除一个学生后自增index错乱
                }
                if (++index <= pageFunc.stuList.length - 1 && index >= 0) {
                    pageFunc.currentStuid = pageFunc.stuList[index];  //更新当前批改学生id到队列后一个学生
                    $(".exercises-student .list").val(pageFunc.currentStuid).trigger("change");
                }
                else {
                    //此题批改完毕，置入重批队列
                    if (pageFunc.recorrectList.indexOf(pageFunc.queid) == -1)
                        pageFunc.recorrectList.push(pageFunc.queid);
                    //检查大题是否该置入重批队列
                    if (pageFunc.quetype == 1)
                        pageFunc.checkMainQueIsRecorrect();
                    //后面没有学生时，切换题目
                    var nextQue = pageFunc.queryNextQues();
                    if (!isNullOrUndefined(nextQue.queid)) {
                        var text = pageFunc.isrec == "0" ? "批改" : "检查";
                        $.MsgBox.Confirm("提示", "继续" + text + nextQue.title + "?", function () {
                            $(".exercises-number .list").val(nextQue.queid).trigger("change");
                        }, function () {
                            pageFunc.backToWorkList();
                        });
                    } else {
                        //是否存在下一个班级
                        var nextClass = $(".exercises-name .list option:checked").next();
                        var text = pageFunc.isrec == "0" ? "批改 " : "检查 ";
                        if(nextClass.length != 0){
                            $.MsgBox.Confirm("提示", "继续"+text + nextClass.text() + "?", function () {
                                $(".exercises-name .list").val(nextClass.val()).trigger("change");
                            }, function () {
                                pageFunc.backToWorkList();
                            });
                        }else{
                            //返回列表页
                            pageFunc.backToWorkList();
                        }
                    }
                }
            } else {
                //加载前一个学生答题情况
                index = pageFunc.allStuList.indexOf(pageFunc.currentStuid);//获取当前所选学生在队列中的位置
                if (--index >= 0) {
                    pageFunc.currentStuid = pageFunc.allStuList[index]; //更新当前批改学生id到队列前一个学生
                    $(".exercises-student .list").val(pageFunc.currentStuid).trigger("change");
                } else {
                    $("body").tooltip("show", "已是第一个学生！", {style: 'warning'});
                }
            }
            pageFunc.lastChangeStuFlag = 0;
        },

        /*小题进入批改，检查所属大题下的小题是否都批改完毕，是的话，将大题也置入重批队列*/
        checkMainQueIsRecorrect: function () {
            var untotal = 0;
            for (var i = 0; i < pageFunc.quesList.length; i++) {
                var quesItem = pageFunc.quesList[i];//大题对象
                //按照小题进入，优先未批改小题，优先同大题下的小题
                if (quesItem.queid != pageFunc.quepid) continue; //跳过其他大题
                var isMainComplete = quesItem.total - quesItem.end == 0;
                if (isMainComplete || pageFunc.recorrectList.indexOf(quesItem.queid) != -1) continue; //跳过重批的大题
                for (var j = 0; j < quesItem.childs.length; j++) {
                    var child = quesItem.childs[j];
                    var isComplete = child.total - child.end == 0;
                    if (isComplete || pageFunc.recorrectList.indexOf(child.queid) != -1) continue;//跳过已批改
                    untotal++;
                }
            }
            //如果大题不存在于重批队列，切下面的小题都批改完成，则置入重批队列
            if (untotal == 0)
                pageFunc.recorrectList.push(pageFunc.quepid);
        },

        /*查找下一个未批改的题目，根据pageFunc.quesList查找，小题进入优先找未批改的小题，如没有按小题批改的未批改小题则切换大题*/
        queryNextQues: function () {
            var next = {};
            if (pageFunc.quetype == 1) {
                next = pageFunc.queryNextOptQues(pageFunc.quepid);
                //找不到同大题下的未批改小题，再去找其他大题下的未批改小题
                if (typeof (next.queid) == 'undefined')
                    next = pageFunc.queryNextOptQues("");
                //找不到未批改的小题，再去找未批改的大题
                if (typeof (next.queid) == 'undefined')
                    next = pageFunc.queryNextMainQues();
            } else {
                next = pageFunc.queryNextMainQues();
            }
            return next;
        },

        /*查找下一个未批改小题*/
        queryNextOptQues: function (pid) {
            var next = {};
            for (var i = 0; i < pageFunc.quesList.length; i++) {
                var quesItem = pageFunc.quesList[i];//大题对象
                //按照小题进入，优先未批改小题，优先同大题下的小题
                if (quesItem.iscorrect == 1) continue; //跳过大题批改
                if (pid != "" && quesItem.queid != pid) continue;//有pid情况下，只查找同大题下的小题
                for (var j = 0; j < quesItem.childs.length; j++) {
                    var child = quesItem.childs[j];
                    var isComplete = child.total - child.end == 0;
                    if (isComplete || pageFunc.recorrectList.indexOf(child.queid) != -1) continue;//跳过已批改
                    next["title"] = quesItem.title;
                    next["queid"] = child.queid;
                    next["quetype"] = child.type;
                    return next;
                }
            }
            return next;
        },

        /*查找下一个未批改的大题*/
        queryNextMainQues: function () {
            var next = {};
            for (var i = 0; i < pageFunc.quesList.length; i++) {
                var quesItem = pageFunc.quesList[i];//大题对象
                    if (quesItem.queid == pageFunc.queid && pageFunc.quesList[i + 1] != null) {
                        next["title"] = pageFunc.quesList[i + 1].title;
                        next["queid"] = pageFunc.quesList[i + 1].queid;
                        next["quetype"] = pageFunc.quesList[i + 1].type;
                        break;
                    }
            }
            return next;
        },

        /*返回作业列表*/
        backToWorkList: function () {
            cef.message.sendMessage('micro.jsMsgExecFunc', ['stopCache', '']);
            window.location.href = "../main.html?userid=" +localStorage.userId+"&pageType=1&pageIndex="+getQueryStringRegExp("pageIndex");
        },

        /*初始化上传学生队列*/
        initUploadList: function (json) {
            if (json == "") return;
            var data = eval("(" + json + ")");
            $.each(data, function (index, item) {
                pageFunc.uploadingStuList.push(item.shwid + item.queid);
                var state = item.action == 0 ? "上传失败" : "正在上传";
                $("span[data-uploadid=" + item.shwid + item.queid + "]").removeClass("wpg").removeClass("fs").addClass("wtj").addClass("upload").html(state);
            });
        },

        /*更新提交结果上传完毕的学生下拉项状态*/
        updateStuItem: function (json) {
            if (json == "") return;
            var item = eval("(" + json + ")");
            var index = pageFunc.uploadingStuList.indexOf(item.shwid + item.queid);
            if (index == -1) return;
            pageFunc.uploadingStuList.splice(index, 1);
            var score = localStorage.getItem(item.shwid + item.queid);
            $("span[data-uploadid=" + item.shwid + item.queid + "]").removeClass("upload").addClass("fs").attr("data-score", score).data("score", score).html(score + "分");//更新学生下拉列表状态
            pageFunc.calcAvgInfo();//刷新平均分信息
        },

        startProcess: function () {
            globalObj.ajaxHttp("correctWorkbyQue",{ workId:pageFunc.workid, isRevise:pageFunc.isrevise},function (data) {
                var classList = [];
                for (var i = 0; i < data.length; i++) {
                    var isSubmit = false;
                    data[i].queslist.forEach(function (item) {
                        if(item.total>0)
                            isSubmit = true;
                    });
                    //有提交的班级
                    if(isSubmit){
                        classList.push({id:data[i].classid,text:(data[i].gradename+data[i].classname),count:data[i].notcount});
                        if(pageFunc.classid==""){
                            pageFunc.classid = data[i].classid;
                        }
                    }
                }
                pageFunc.loadClassHtml(classList);
            });
        }
    };
    globalObj.correctObj = pageFunc;
    pageFunc.init();
});