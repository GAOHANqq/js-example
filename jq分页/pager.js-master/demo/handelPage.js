handlePageBox:function () {
	this.totalCount = 0;
	this.limit = 10
	this.pageCount = 0;
	this.curPageIndex = 1;

	var self = this;
	self.pageBox.show();
	var pageCount = parseInt(self.totalCount / self.limit);
	if (self.totalCount % self.limit > 0) pageCount++;
	self.pageCount = pageCount;
	self.$(".number-btn,.suff-dot,.pre-dot", self.pageBox).hide();

	if(self.curPageIndex == 1)
		self.$(".prve-btn").hide();
	else
		self.$(".prve-btn").show();
	if(self.curPageIndex == pageCount)
		self.$(".searchIcon-btn").hide();
	else
		self.$(".next-btn").show();

	if(pageCount <2){
		self.$(".prve-btn,.next-btn").hide();
	}
	else if (pageCount <= 7) {
		for (var i = 1; i <= pageCount; i++) {
			self.pageBox.find(".num" + i).html(i).attr("data-index", i).show();
		}
	}
	else {
		self.$(".num1", self.pageBox).html(1).attr("data-index", "1");
		self.$(".num2", self.pageBox).html(2).attr("data-index", "2");
		if (self.curPageIndex <= pageCount - 4)
			self.$(".suff-dot", self.pageBox).show();
		if (self.curPageIndex <= 4) {
			self.$(".pre-dot", self.pageBox).hide();
			self.$(".num3", self.pageBox).html(3).attr("data-index", "3");
			self.$(".num4", self.pageBox).html(4).attr("data-index", "4");
			self.$(".num5", self.pageBox).html(5).attr("data-index", "5");
		}
		else if (self.curPageIndex > 4) {
			self.$(".pre-dot", self.pageBox).show();
			self.$(".num3", self.pageBox).html(self.curPageIndex - 1).attr("data-index", this.curPageIndex - 1);
			self.$(".num4", self.pageBox).html(self.curPageIndex).attr("data-index", this.curPageIndex);
			self.$(".num5", self.pageBox).html(self.curPageIndex + 1).attr("data-index", this.curPageIndex + 1);
		}
		if (self.curPageIndex > pageCount - 4) {
			self.$(".suff-dot", self.pageBox).hide();
			self.$(".num3", self.pageBox).html(pageCount - 4).attr("data-index", pageCount - 4);
			self.$(".num4", self.pageBox).html(pageCount - 3).attr("data-index", pageCount - 3);
			self.$(".num5", self.pageBox).html(pageCount - 2).attr("data-index", pageCount - 2);
		}
		self.$(".num6", self.pageBox).html(pageCount - 1).attr("data-index", pageCount - 1);
		self.$(".num7", self.pageBox).html(pageCount).attr("data-index", pageCount);
		self.$(".number-btn", self.pageBox).show();
	}

	self.$(".page-box .number-btn").removeClass("select");
	self.$(".page-box .number-btn[data-index='" + self.curPageIndex + "']").addClass("select");
	self.pageBox.show();

	//分页按钮点击
	self.$('.page-box .number-btn').unbind('click').bind('click', function () {
		self.$('.page-box .number-btn').removeClass('select');
		self.curPageIndex = parseInt($(this).html());
		self.getQuestionList();
	});

	//前一页按钮点击
	self.$('.page-box .prve-btn').unbind('click').bind('click', function () {
		if (self.curPageIndex == 1) return;
		self.curPageIndex--;
		self.handlePageBox();
		self.$(".page-box .number-btn[data-index='" + self.curPageIndex + "']").trigger("click");
	});

	//前一页按钮点击
	self.$('.page-box .next-btn').unbind('click').bind('click', function () {
		if (self.curPageIndex == self.pageCount) return;
		self.curPageIndex++;
		self.handlePageBox();
		self.$(".page-box .number-btn[data-index='" + self.curPageIndex + "']").trigger("click");
	});
},
