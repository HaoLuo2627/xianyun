require("sdk/libs/strophe");
let WebIM = require("utils/WebIM")["default"];
let msgStorage = require("comps/chat/msgstorage");
let msgType = require("comps/chat/msgtype");
let ToastPannel = require("./comps/toast/toast");
let disp = require("utils/broadcast");
let logout = false;

function ack(receiveMsg) {
  // 处理未读消息回执
  var bodyId = receiveMsg.id;         // 需要发送已读回执的消息id
  var ackMsg = new WebIM.message("read", WebIM.conn.getUniqueId());
  ackMsg.set({
    id: bodyId,
    to: receiveMsg.from
  });
  WebIM.conn.send(ackMsg.body);
}

function onMessageError(err) {
  if (err.type === "error") {
    wx.showToast({
      title: err.errorText
    });
    return false;
  }
  return true;
}

function getCurrentRoute() {
  let pages = getCurrentPages();
  let currentPage = pages[pages.length - 1];
  return currentPage.route;
}

function calcUnReadSpot(message) {
  let myName = wx.getStorageSync("myUsername");
  let members = wx.getStorageSync("member") || []; //好友
  var listGroups = wx.getStorageSync('listGroup') || []; //群组
  let allMembers = members.concat(listGroups)
  let count = allMembers.reduce(function (result, curMember, idx) {
    let chatMsgs;
    if (curMember.roomId) {
      chatMsgs = wx.getStorageSync(curMember.roomId + myName.toLowerCase()) || [];
    } else {
      chatMsgs = wx.getStorageSync(curMember.name.toLowerCase() + myName.toLowerCase()) || [];
    }
    return result + chatMsgs.length;
  }, 0);
  getApp().globalData.unReadMessageNum = count;
  disp.fire("em.xmpp.unreadspot", message);
}

function register(id) {
  const that = this;
  console.log("register_id:" + id)
  var options = {
    apiUrl: WebIM.config.apiURL,
    username: id,
    password: '123456',
    nickname: '',
    appKey: WebIM.config.appkey,
    success: function (res) {
      console.log('res', res)
      if (res.statusCode == "200") {
        console.log("注册成功");
        var data = {
          apiUrl: WebIM.config.apiURL,
          user: id,
          pwd: '123456',
          grant_type: "password",
          appKey: WebIM.config.appkey
        };
      }
    },
    error: function (res) {
      console.log('res', res)
      if (res.statusCode !== "200") {
        if (res.statusCode == '400' && res.data.error == 'illegal_argument') {
          // login(id,key)
          return console.log('用户名非法')
        }
        console.log('用户名已被占用!')
      }
    },

  };
  WebIM.utils.registerUser(options);
}

function login(id) {
  WebIM.conn.open({
    apiUrl: WebIM.config.apiURL,
    user: id,
    pwd: '123456',
    grant_type: "password",
    appKey: WebIM.config.appkey
  });
  console.log('登陆成功')
}


var useId = ''
App({
  ToastPannel,
  globalData: {
    unReadMessageNum: 0,
    userInfo: null,
    OpenId:'',
    yourname:'',
    saveFriendList: [],
    saveGroupInvitedList: [],
    isIPX: false //是否为iphone X
  },

  conn: {
    closed: false,
    curOpenOpt: {},
    open(opt) {
      this.curOpenOpt = opt;
      WebIM.conn.open(opt);
      this.closed = false;
    },
    reopen() {
      if (this.closed) {
        //this.open(this.curOpenOpt);
        WebIM.conn.open(this.curOpenOpt);
        this.closed = false;
      }
    }
  },

  // getPage(pageName){
  // 	var pages = getCurrentPages();
  // 	return pages.find(function(page){
  // 		return page.__route__ == pageName;
  // 	});
  // },

  onLaunch() {
    // 调用 API 从本地缓存中获取数据
    var me = this;
    
    var logs = wx.getStorageSync("logs") || [];
    logs.unshift(Date.now());
    wx.setStorageSync("logs", logs);
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }
    
    wx.login({
      success: res => {
        var code = res.code;
        var that=this;
       // console.log(code);
        var appId = 'wx2e35d330a5f7111c';
        var secret = '06fa856061307580f443675bc3bfb096';
        wx.request({
          url: 'https://api.weixin.qq.com/sns/jscode2session?appid='
            + appId + '&secret=' + secret +
            '&js_code=' + code + '&grant_type=authorization_code',
          data: {},
          header: {
            'content-type': 'json'
          },
          success: function (res) {
            useId = res.data.openid //返回openid
            that.globalData.OpenId = useId
            //console.log('openid为' + useId);
             
            console.log('openid为' + useId);
            
            wx.setStorage({
              key: "myUsername",
              data: useId
            })
          }
        })
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
     
    //register(wx.getStorageSync("myUsername"))

    login(wx.getStorageSync("myUsername"))
    //register(this.globalData.OpenId, 123456)
   // wx.showModal({
     // title:useId,   	
   // })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
      
    })
    
    // 
    disp.on("em.main.ready", function () {
      calcUnReadSpot();
    });
    disp.on("em.chatroom.leave", function () {
      calcUnReadSpot();
    });
    disp.on("em.chat.session.remove", function () {
      calcUnReadSpot();
    });
    disp.on('em.chat.audio.fileLoaded', function () {
      calcUnReadSpot()
    });

    disp.on('em.main.deleteFriend', function () {
      calcUnReadSpot()
    });
    disp.on('em.chat.audio.fileLoaded', function () {
      calcUnReadSpot()
    });
    

    // 
    WebIM.conn.listen({
      onOpened(message) {
        WebIM.conn.setPresence();
        if (getCurrentRoute() == "pages/detail/detail") {
          me.onLoginSuccess(wx.getStorageSync("myUsername").toLowerCase());
        }
      },
      onReconnect() {
        wx.showToast({
          title: "重连中...",
          duration: 2000
        });
      },
      onClosed() {
        wx.showToast({
          title: "网络已断开连接",
          duration: 2000
        });
        wx.redirectTo({
          url: "../index1/index"
        });
        me.conn.closed = true;
        WebIM.conn.close();
      },
      onInviteMessage(message) {
        me.globalData.saveGroupInvitedList.push(message);
        disp.fire("em.xmpp.invite.joingroup", message);
        // wx.showModal({
        // 	title: message.from + " 已邀你入群 " + message.roomid,
        // 	success(){
        // 		disp.fire("em.xmpp.invite.joingroup", message);
        // 	},
        // 	error(){
        // 		disp.fire("em.xmpp.invite.joingroup", message);
        // 	}
        // });
      },
      onPresence(message) {
        //console.log("onPresence", message);
        switch (message.type) {
          case "unsubscribe":
            // pages[0].moveFriend(message);
            break;
          // 好友邀请列表
          case "subscribe":
            if (message&&message.status === "[resp:true]") {
              WebIM.conn.subscribed({
                to: me.globalData.OpenId,
                message: "[resp:true]",
              });
               WebIM.conn.subscribe({
        to: getApp().globalData.OpenId,
        message: "[resp:true]",
      });
            }
            else {
              // pages[0].handleFriendMsg(message);
              for (let i = 0; i < me.globalData.saveFriendList.length; i++) {
                if (me.globalData.saveFriendList[i].from === message.from) {
                  me.globalData.saveFriendList[i] = message
                  disp.fire("em.xmpp.subscribe");
                  return;
                }
              }
              me.globalData.saveFriendList.push(message);
              disp.fire("em.xmpp.subscribe");
            }
            break;
          case "subscribed":
            wx.showToast({
              title: "添加成功",
              duration: 1000
            });
            disp.fire("em.xmpp.subscribed");
            break;
          case "unsubscribed":
            // wx.showToast({
            // 	title: "已拒绝",
            // 	duration: 1000
            // });
            break;
          case "memberJoinPublicGroupSuccess":
            wx.showToast({
              title: "已进群",
              duration: 1000
            });
            break;
          // 好友列表
          // case "subscribed":
          // 	let newFriendList = [];
          // 	for(let i = 0; i < me.globalData.saveFriendList.length; i++){
          // 		if(me.globalData.saveFriendList[i].from != message.from){
          // 			newFriendList.push(me.globalData.saveFriendList[i]);
          // 		}
          // 	}
          // 	me.globalData.saveFriendList = newFriendList;
          // 	break;
          // 删除好友
          case "unavailable":
            console.log('delete')
            disp.fire("em.xmpp.contacts.remove");
            break;

          // case "joinChatRoomSuccess":
          // 	wx.showToast({
          // 		title: "JoinChatRoomSuccess",
          // 	});
          // 	break;
          // case "memberJoinChatRoomSuccess":
          // 	wx.showToast({
          // 		title: "memberJoinChatRoomSuccess",
          // 	});
          // 	break;
          // case "memberLeaveChatRoomSuccess":
          // 	wx.showToast({
          // 		title: "leaveChatRoomSuccess",
          // 	});
          // 	break;

          default:
            break;
        }
      },
      
      

      onRoster(message) {
        // let pages = getCurrentPages();
        // if(pages[0]){
        // 	pages[0].onShow();
        // }
      },

      // onVideoMessage(message){
      // 	console.log("onVideoMessage: ", message);
      // 	if(message){
      // 		msgStorage.saveReceiveMsg(message, msgType.VIDEO);
      // 	}
      // },

      onAudioMessage(message) {
        console.log("onAudioMessage", message);
        if (message) {
          if (onMessageError(message)) {
            msgStorage.saveReceiveMsg(message, msgType.AUDIO);
          }
          calcUnReadSpot(message);
          ack(message);
        }
      },

      onCmdMessage(message) {
        console.log("onCmdMessage", message);
        if (message) {
          if (onMessageError(message)) {
            msgStorage.saveReceiveMsg(message, msgType.CMD);
          }
          calcUnReadSpot(message);
          ack(message);
        }
      },

      // onLocationMessage(message){
      // 	console.log("Location message: ", message);
      // 	if(message){
      // 		msgStorage.saveReceiveMsg(message, msgType.LOCATION);
      // 	}
      // },

      onTextMessage(message) {
        console.log("onTextMessage", message);
        if (message) {
          if (onMessageError(message)) {
            msgStorage.saveReceiveMsg(message, msgType.TEXT);
          }
          calcUnReadSpot(message);
          ack(message);
        }
        else{
          calcUnReadSpot(message);
          ack(message);
        }
      },

      onEmojiMessage(message) {
        console.log("onEmojiMessage", message);
        if (message) {
          if (onMessageError(message)) {
            msgStorage.saveReceiveMsg(message, msgType.EMOJI);
          }
          calcUnReadSpot(message);
          ack(message);
        }
      },

      onPictureMessage(message) {
        console.log("onPictureMessage", message);
        if (message) {
          if (onMessageError(message)) {
            msgStorage.saveReceiveMsg(message, msgType.IMAGE);
          }
          calcUnReadSpot(message);
          ack(message);
        }
      },

      onFileMessage(message) {
        console.log('onFileMessage', message);
        if (message) {
          if (onMessageError(message)) {
            msgStorage.saveReceiveMsg(message, msgType.FILE);
          }
          calcUnReadSpot(message);
          ack(message);
        }
      },

      // 各种异常
      onError(error) {
        // 16: server-side close the websocket connection
        if (error.type == WebIM.statusCode.WEBIM_CONNCTION_DISCONNECTED && !logout) {
          if (WebIM.conn.autoReconnectNumTotal < WebIM.conn.autoReconnectNumMax) {
            return;
          }
          wx.showToast({
            title: "server-side close the websocket connection",
            duration: 1000
          });
          wx.redirectTo({
            url: "../index/index"
          });
          logout = true
          return;
        }
        // 8: offline by multi login
        if (error.type == WebIM.statusCode.WEBIM_CONNCTION_SERVER_ERROR) {
          wx.showToast({
            title: "offline by multi login",
            duration: 1000
          });
          wx.redirectTo({
            url: "../index/index"
          });
        }
        if (error.type == WebIM.statusCode.WEBIM_CONNCTION_OPEN_ERROR) {
          wx.hideLoading()
          disp.fire("em.xmpp.error.passwordErr");
          // wx.showModal({
          // 	title: "用户名或密码错误",
          // 	confirmText: "OK",
          // 	showCancel: false
          // });
        }
        if (error.type == WebIM.statusCode.WEBIM_CONNCTION_AUTH_ERROR) {
          wx.hideLoading()
          disp.fire("em.xmpp.error.tokenErr");
        }
      },
    });
    disp.on("em.xmpp.subscribe", function () {
      
    });

    this.checkIsIPhoneX();
  },
  
   
  onShow() {
    this.conn.reopen();
  },

  onUnload() {
    WebIM.conn.close();
    WebIM.conn.stopHeartBeat();
  },

  onLoginSuccess: function (myName) {
    wx.hideLoading()
    wx.redirectTo({
      url: "../index1/index?myName=" + myName
    });
  },

  getUserInfo(cb) {
    var me = this;
    if (this.globalData.userInfo) {
      typeof cb == "function" && cb(this.globalData.userInfo);
    }
    else {
      // 调用登录接口
      wx.login({
        success() {
          wx.getUserInfo({
            success(res) {
              me.globalData.userInfo = res.userInfo;
              typeof cb == "function" && cb(me.globalData.userInfo);
            }
          });
        }
      });
    }
  },
  checkIsIPhoneX: function () {
    const me = this
    wx.getSystemInfo({
      success: function (res) {
        // 根据 model 进行判断
        if (res.model.search('iPhone X') != -1) {
          me.globalData.isIPX = true
        }
      }
    })
  },
});
