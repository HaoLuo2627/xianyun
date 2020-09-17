// miniprogram/pages/release.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    counterId: '',
    openid: '',
    count: null,
    list:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getdata()
  },
  onShow: function () {
    this.getdata()
  },
  goDetail(e) {
    wx.navigateTo({
      url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}`,
    })
  },
  XiuGai(e){
    wx.navigateTo({
      url: `/pages/modify/modify?id=${e.currentTarget.dataset.id}`,
    })
  },

  ShanChu(e){
    const db = wx.cloud.database()
    console.log("e.currentTarget.id:" + e.currentTarget.dataset.id)
    db.collection('goods').doc(e.currentTarget.dataset.id).remove({
      success: res => {
            wx.showToast({
              title: '删除成功',
            })
          },
          fail: err => {
             wx.showToast({
               icon: 'none',
               title: '删除失败',
             })
            console.error('[数据库] [删除记录] 失败：', err)
           }
        })
     this.getdata(); 
  },
  getdata: function () {
    const db = wx.cloud.database()
    // 查询当前用户所有的 counters
    db.collection('goods').where({
      _openid: wx.getStorageSync("myUsername"),
    }).get({
      success: res => {
     
        if (res.data.length) {
          console.log('[数据库] [查询记录] 成功: ', res.data);
          this.setData({
            list: res.data
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: '暂无此类商品'
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
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  }
})