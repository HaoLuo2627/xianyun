let WebIM = require("../../utils/WebIM")["default"];
let disp = require("../../utils/broadcast");

const app = getApp()

Page({
  data: {
    currentTab: 0,
    grids: 5,
    swiperList: 0,
    list: [],
  },

  onLoad: function () {
    
    this.getdata()
    //console.log("app.globleData:" + app.globalData.OpenId)
    wx.clearStorage()
  },

  onShow: function () {
    this.getdata()
  },

  onPullDownRefresh: function () {
    this.getdata()
  },

  bindViewTap: function () {
    wx.navigateTo({
      url: '../add/logs'
    })
  },

  goSearch(e) {
    wx.navigateTo({
      
      url: '../search/search',
    })
  },

  click: function (e) {
    console.log(e.currentTarget.dataset.id)
    switch (e.currentTarget.dataset.id){
      case 0:
        wx.navigateTo({
          url: '../classify/books/books'
        })
        break;
      case 1:
        wx.navigateTo({
          url: '../classify/clothes/clothes'
        })
        break;
      case 2:
        wx.navigateTo({
          url: '../classify/phones/phones'
        })
        break;
      case 3:
        wx.navigateTo({
          url: '../classify/snacks/snacks'
        })
        break;
      case 4:
        wx.navigateTo({
          url: '../classify/others/others'
        })
        break;
    }
    
  },
   goDetail(e) {
    wx.navigateTo({
      url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}`,
    })
  },
    getdata: function () {
    const db = wx.cloud.database()
    // 查询当前用户所有的 counters
    db.collection('goods').get({
      success: res => {
        if (res.data.length) {
          console.log('[数据库] [查询记录] 成功: ', res.data);
          this.setData({
            list: res.data
          })
        } 
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },

})
