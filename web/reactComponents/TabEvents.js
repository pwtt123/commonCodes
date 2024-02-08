   // 根据对应column配置生成单个formItem
   class TabEvents {
    constructor(props: any) {
      eventCenter.subscribe(eventCenterNames.tabClosed, this.tabCloseListener.bind(this))
    };
    destroy() {
      eventCenter.unsubscribe(this.tabCloseListener)
    }
    tabCloseListener(eventName: any, {tabPathname}: any) {
      // console.log("tabCloseListener", tabPathname, this.closingTabConfig)
      const closingTabConfig = this.closingTabConfig || {};
      // 若关闭的tab 为 当前关闭队列中执行关闭的tab，则执行监听事件
      if (tabPathname == closingTabConfig.key && _.isFunction(closingTabConfig.listener)) closingTabConfig.listener();
    };
    isTabClosing: boolean = false;
    // 待关闭tab队列
    // {eachCallback,id,key,closeDirectly}
    tabQueue2Close: any = [];
    // 当前正在执行关闭的tab
    closingTabConfig: any = { key: null, listener: () => { }, timer: {} };
    stopClosePages: StopClosePage[] = [];
    // 以同步的方式关闭多个tab,每个关闭准备工作完成后会执行 eachCallback(tab2Close),若tab2Close存在则需要在eachCallback中关闭此tag，否则不需要关闭
    // tabConfgList:[{key: any, closeDirectly: boolean}]
    // eachCallback(tab2Close),每完成一个关闭tag的准备工作后执行
    // finalCallback,全部完成后执行的回调
    closeTabsSync(tabConfgList: any, eachCallback: any, finalCallback: any) {
      let preId = (this.tabQueue2Close[this.tabQueue2Close.length - 1] || { id: 0 }).id
      let lastId = null;
      // 增加到队列
      _.each(tabConfgList, (tabConfig: any, xId) => {
        lastId = preId + xId;
        this.tabQueue2Close.push(_.extend(_.clone(tabConfig), { eachCallback, id: lastId }))
      })
      // 开始关闭
      if (this.tabQueue2Close.length > 0) this.startCloseTabQueue(lastId, finalCallback)
    }
    // 开启队列关闭
    startCloseTabQueue(finalQueueid: number, finalCallback: any) {
      // console.log("startCloseTabQueue", this.tabQueue2Close)
      if (this.isTabClosing) return;
      if (this.tabQueue2Close.length < 1) return;
      this.isTabClosing = true;
      this.closeNextTab(finalQueueid, finalCallback);
    }
    //关闭下一个tab
    closeNextTab(finalQueueid: number, finalCallback: any): any {
      if (this.tabQueue2Close.length < 1) return this.isTabClosing = false;
      const zThis = this;
      const currentTag = this.tabQueue2Close[0];
      // console.log("closeNextTab", currentTag);
      if (currentTag.id == finalQueueid && _.isFunction(finalCallback)) finalCallback();
      zThis.tabQueue2Close.shift()
      //若此tab 不存在，则直接关闭下一个
      if (_.indexOf(window.getOpeningTabs(), currentTag.key) < 0) {
        return this.closeNextTab(finalQueueid, finalCallback);
      }
      _.extend(this.closingTabConfig, {
        key: currentTag.key,
        listener() {
          // console.log("closingTagListener", zThis.tabQueue2Close.length, this.timer)
          clearTimeout(this.timer)
          zThis.closeNextTab(finalQueueid, finalCallback)
        },      timer: setTimeout(() => {
          // console.log("timeout")
          // 若3s没有响应，则默认用户取消关闭，清空队列
          zThis.tabQueue2Close.splice(0);
          this.isTabClosing = false;
        }, 3000)
      })
      this.beforeCloseTab(currentTag.key, currentTag.closeDirectly).then((tabCofig) => { if (_.isFunction(currentTag.eachCallback)) currentTag.eachCallback(tabCofig) });
    }
    //
    //resolve({key:stirng, targetKey:string||null,ifNeedClose:boolean||null})
    beforeCloseTab(key: any, closeDirectly: boolean) {
      return new Promise((resolve, reject) => {
        // 向本系统全局发送一个标签页关闭的事件
        eventCenter.publish(eventCenterNames.beforeTabClose, { tabPathname: key });
        // 如果作为子系统，关闭标签页时，向portal发送关闭的消息
        if (window.isInIframe) {
          setTimeout(() => {
            // console.log('发送给portal关闭标签页的消息', process.env.APP_ID, key);
            window.postMsg({
              type: 'closePage',
              appId: process.env.APP_ID,
              page: key,
            });
          }, 100);
        } else if (key.startsWith('http://') || key.startsWith('https://')) {
          // 独立iframe关闭时，向所有子系统发送消息
          window.iframeContainers.forEach(item => {
            const win = item.instance.window;
            win.postMessage({
              type: 'tab-close-global',
              page: key,
            }, '*');
          });
        }      // 本地页面，判断是否注册监听事件
        else {
          const pageCloseRegister = window.getPageCloseRegister(key);
          if (_.isFunction(pageCloseRegister)) {
            if (closeDirectly) return resolve({ key, targetKey: key, ifNeedClose: true });
            resolve({ key, targetKey: key, ifNeedClose: false });
            setTimeout(pageCloseRegister, 50);
            return;
          }
        }
        // 如果是直接关闭, 不再通知子应用
        if (closeDirectly) {
          resolve({ key: key, targetKey: key, ifNeedClose: true })
          // resolve([key], key);
          return;
        }
        // 通知子应用要关闭的tab
        if (key && key.includes('iframe_godzilla')) {
          const { appId, page: targetPage } = window.getUrlParams(key);
          if (appId && targetPage) {
            window.postMessageToIframe({
              type: 'closePage',
              appId,
              page: targetPage,
            });
          }
        }      setTimeout(() => {
          // 延时一段时间之后如果未收到消息, 或者子应用发起了阻止关闭的通知, 过滤掉不需要关闭的页面
          // 找到在 阻止关闭 列表里的页面, 规则: appId 存在, 并且 appId 和 page 完全匹配
          resolve({
            key, targetKey: key, ifNeedClose: !this.stopClosePages.some(item => {
              return key === item.page;
            })
          });
          // this.clearStopClosePages();
        }, 50);
      })
    }
    notifyIframeCloseManyPages(pages: string[]) {
      return new Promise((resolve, reject) => {
        pages.forEach(page => {
          // 通知每个子应用要关闭的tab
          if (page && page.includes('iframe_godzilla')) {
            const { appId, page: targetPage } = window.getUrlParams(page);
            if (appId && targetPage) {
              window.postMessageToIframe({
                type: 'closePage',
                appId,
                page: targetPage,
              });
            }
          }
        });
        setTimeout(() => {
          // 延时一段时间之后如果未收到消息, 或者子应用发起了阻止关闭的通知, 过滤掉不需要关闭的页面
          const closePages = pages.filter(page => {
            return !this.stopClosePages.some(item => {
              // 找到在 阻止关闭 列表里的页面, 规则: appId 存在, 并且 appId 和 page 完全匹配
              return page === item.page;
            });
          });
          resolve(closePages);
          this.clearStopClosePages();
        }, pages.length * 50 <= 300 ? pages.length * 50 : 300);
      });
    };
    addStopClosePage(data: StopClosePage) {
      this.stopClosePages.push(data);
    }
    clearStopClosePages() {
      this.stopClosePages = [];
    }
  }