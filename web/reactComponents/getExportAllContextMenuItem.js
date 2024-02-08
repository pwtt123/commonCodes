getExportAllContextMenuItem(params: any, exportParams: any) {
    const { searchApi, tableConfig } = this.props;
    // 全量导出菜单项
    const exportExcelAllItem = {
      name: '导出全量Excel',
      action: () => {
        let refExportProgress: any;
        let refExportSetting: any;
        let isExporting = false;
        //用户自定义相关参数
        let exportCustomSettings = _.clone(exportParams.defaultExportCustomSetting)
        // 用户自定义配置增加部分程序默认配置
        _.extend(exportCustomSettings, {
          pageSize: exportParams.exportPageSize,
          eachBatchNum: exportParams.exportEachBatchNum,
          eachBatchInterval: exportParams.exportEachBatchInterval,
        });
        // console.log("exportCustomSettings", exportCustomSettings)
        // 导出获取数据的分页相关参数
        const total = Math.min(this.state.total, exportParams.exportDataLimit);
        let promiseList: any = [];
        const getTotalPage = () => Math.ceil(total / Number(exportCustomSettings.pageSize));
        // console.log("total", total, pageSize, totalPage)
        //分批定时导出
        interface IExeExportFuncOptions {
          exportTotalNum: any;// 导出总数
        }
        const exeExportFunc = (exeExportFuncOptions: IExeExportFuncOptions) => {
          const endPageNum = Math.min(getTotalPage(), Number(exportCustomSettings.endPage))
          // console.log("gggg", exportCustomSettings.startPage, endPageNum, exportCustomSettings.pageSize)
          // 每一页获取数据的promise
          for (let i = Number(exportCustomSettings.startPage); i <= endPageNum; i++) {
            const zPage = i;
            promiseList.push(() => {
              // console.log("isExporting", isExporting)
              return new Promise((res, rej) => {
                searchApi.setPageSize(Number(exportCustomSettings.pageSize));
                searchApi.setPage(zPage);
                searchApi
                  .search()
                  .then((data: any) => {
                    if (!data) return res([]);
                    // 最后一页时，若有余数，只返回余数的数据
                    if (zPage == getTotalPage() && total % Number(exportCustomSettings.pageSize)) {
                      data.list = data.list.slice(0, total % Number(exportCustomSettings.pageSize));
                    }
                    // console.log("res", zPage, data.list)
                    res(data.list);
                  })
                  .catch((e: any) => {
                    rej(e);
                  });
              });
            });
          }// 导出的所有数据的菜单栏项
  
          // 按同步数分组
          promiseList = _.chunk(promiseList, Number(exportCustomSettings.eachBatchNum));
          let exportTableApi: any;
          const zAllData: any = [];
          // 增加finall，导出到execel
          promiseList.push([() => {
            return new Promise((res) => {
              // 设置全量数据和处理过的columnDefs到导出用表格
              const exportColumnDefs = this.tableStore.getGridColumnApi().getAllColumns().map(item => item.colDef);
              exportTableApi.setRowData(zAllData);
              // headerComponentParams 带有ref属性，不去掉会导致渲染全选框报错
              exportTableApi.setColumnDefs(_.map(exportColumnDefs, (v: any) => _.omit(v, "headerComponentParams")));
              // 导出excel
              exportTableApi.exportDataAsExcel(
                getExportParams({ columnApi: params.columnApi, context: params.context, ..._.pick(exportCustomSettings, "fileName", "sheetName") }, { exportAll: true })
              );
              exportLoadingModal.close()
              setTimeout(() => {
                if (_.isFunction(tableConfig.onExportFinished)) tableConfig.onExportFinished();
              })
              res()
            })
          }])
          // 打开弹框
          exportLoadingModal.openInfo('正在导出', <CompExportProgress exportTableApi={(api) => { exportTableApi = api } } ref={(el) => { refExportProgress = el } } totalNum={exeExportFuncOptions.exportTotalNum} totalPage={promiseList.length - 1} />, {
            onCancel: () => { isExporting = false; confirm("导出已终止！"); exportLoadingModal.close(); }
          });
          isExporting = true;
          // 执行promise
          _.reduce(promiseList, (pre, nextList, index) => {
            // 当弹框关闭等原因终止了导出，停止后面的数据请求
            if (!isExporting) return;
            return pre.then(() => {
              return new Promise((res) => {
                setTimeout(() => {
                  if (!isExporting) return;
                  refExportProgress.setCurrent(index + 1);
                  // 每个批次内的请求并行执行
                  Promise.all(_.map(nextList, zPromise => zPromise())).then(res);
                }, Number(exportCustomSettings.eachBatchInterval));
              });
            })
              .then((listArray: any) => {
                // console.log("listArray", listArray)
                if (listArray && listArray.length) zAllData.push(..._.concat(...listArray));
              });
          },
            Promise.resolve(),
          );
        }
        if (exportParams.ifOpenExportCustomSetting) {
          exportSettingModal.openInfo('导出设置', <CompExportSetting ref={(el) => { refExportSetting = el } } message={{ total, limit: exportParams.exportDataLimit, getTotalPage }} settings={exportCustomSettings} onChange={(v) => { _.extend(exportCustomSettings, v) } } />, {
            onOk: () => {
              refExportSetting.validateFields().then((values) => {
                exeExportFunc({ exportTotalNum: refExportSetting.exportTotalNum || total })
                exportSettingModal.close();
              }).catch((err) => {
                console.log("validateFieldErr", err)
              })
            },
            onCancel: () => { exportSettingModal.close(); }
          });
        } else {
          exeExportFunc({ exportTotalNum: total })
        }
      },
    };
    return exportExcelAllItem;
  }