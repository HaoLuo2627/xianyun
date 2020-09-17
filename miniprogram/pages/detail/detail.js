// miniprogram/pages/detail.js
let WebIM = require("../../utils/WebIM")["default"];
let disp = require("../../utils/broadcast");
const app = getApp()
var ownerid=''
var productid=''
var IsCollect=''
var token=''

Page({
  /**
   * 页面的初始数据
   */
  data: {
    detail: {},
    openid: '',
    collected:true,
    unReadSpotNum: 0, //未读消息数
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    productid=options.id
    this.loadDetail(options.id) // 加载详情
    this.getcollect()
    console.log(options.id)

    //register(app.globalData.OpenId)
    
   this.getToken()

    //监听未读“聊天”

  },

  onShow: function () {
    this.getcollect()
   
  },

  into_chatRoom: function (event) {

    
    //login(app.globalData.OpenId)
   // new app.ToastPannel.ToastPannel();
     
    console.log(token)
    console.log("ownerid="+ownerid )
    app.globalData.yourname = ownerid

    this.add(app.globalData.OpenId, ownerid, token)

    var my = wx.getStorageSync("myUsername");

    var nameList = {
      myName: my,
      your: ownerid
    };
    wx.navigateTo({
      url: "../chatroom/chatroom?username=" + JSON.stringify(nameList)
    });
    console.log("myUsername" + wx.getStorageSync("myUsername"))

  },



  getToken() {
    wx.request({
      url: "http://a1.easemob.com/1109190602090245/xianyun/token",
      method: 'POST',
      header: {
        'content-type': 'application/json',
      }, data: {
        "grant_type": "client_credentials",
        "client_id": "YXA6W936UIT8EemXqp-Dn7BjCw",
        "client_secret": "YXA6bb0r3sk69p56AnTTFGu0imljW4s"
      },
      success(res) {
        console.log(res)
        token = res.data.access_token
        console.log(token)
      },
      fail(res) {
        console.log("添加好友失败")
      }
    })
  },
  add(u1, u2, pram){
    wx.request({
      url: "https://a1.easemob.com/1109190602090245/xianyun/users/" + u1 + "/contacts/users/" + u2,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer '+pram ,
      },
      success(res) {
        console.log(res)
        console.log("添加好友成功")
      },
      fail(res) {
        console.log("添加好友失败")
      }
    })
  },
  loadDetail(pram) {
    let that = this
    const db = wx.cloud.database()
    const _ = db.command
    db.collection('goods').where({
      _id: _.eq(pram)
  }).get({
    success(res) {
      console.log('查询结果:', res.data)
      ownerid =res.data[0]._openid,
      that.setData({
        detail: res.data,
      })
    }
  })
  },
  
  getcollect(){
    let that = this
    const db = wx.cloud.database()
    const _ = db.command
    db.collection('goods').where({
      _id: productid
  }).get({
    success(res) {
      
      if(res.data[0].collect==false)
      {
        IsCollect=false
        this.setData({
          collected: false,
        })
        console.log("从未收藏")
      }else{
        IsCollect = true
        this.setData({
          collected: true,
        })
        console.log("已经收藏")
      }
    }
  })
  },
     
  bindCollect() {
    this.getcollect(productid)
    let that = this
    const db = wx.cloud.database()
    if (!IsCollect){
      db.collection('goods').doc(productid).update({ 
         data:{
           collect:true
         },
         success:res=>{
          
           wx.showToast({
             icon: 'none',
             title: '收藏成功'
           })
           that.setData({
             collected:true,
           })
          
         },
         fail:res=>{
           wx.showToast({
             icon: 'none',
             title: '收藏失败'
           })
         }
      })
    }
    else{
      db.collection('goods').doc(productid).update({
        data: {
          collect: false
        },
        success: res => {
            wx.showToast({
              icon: 'none',
              title: '取消收藏成功'
            })
          that.setData({
            collected :false,
          })
        },
        fail: res => {
          wx.showToast({
            icon: 'none',
            title: '取消收藏失败'
          })
        }
      })
    }
    this.getcollect(productid)
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },
  /**
   * 生命周期函数--监听页面显示
   */
 
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
   
})