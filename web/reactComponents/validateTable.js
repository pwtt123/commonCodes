validateTable: (colIndexList, options) => {
    const getErrMsg = (xRowIndex, id, title = "", message = "") => {
        if (!id || !title) return "";
        let dataIndex = xRowIndex;
        if (options.data) dataIndex = _.findIndex(props.dataSource, { id });
        const page = Math.floor(dataIndex / pageOptions.pageSize) + 1;
        const rowIndex = dataIndex % pageOptions.pageSize + 1;
        return `第${page}页-第${rowIndex}行-${title}：${message}`;
    };
    const getAllColumns = (list) => {
        let zReturn = [];
        _.each(list, col => {
            if (col.children) return zReturn.push(...getAllColumns(col.children));
            return zReturn.push(col);
        });
        return zReturn;
    };
    let tableData = options.data || props.dataSource;
    let zColumns = columns;
    if (colIndexList) zColumns = _.filter(columns, xCol => _.includes(colIndexList, xCol.dataIndex));
    let errMsgs = "";
    let promiseList = [];
    _.each(tableData, (xRow, xRowIndex) => {
        if (errMsgs) return;
        _.each(getAllColumns(zColumns), (xCol) => {
            if (errMsgs) return;
            let cell = xRow[xCol.dataIndex];
            if (xCol.editable && !xCol.disabled) {
                const zRules = _.isFunction(xCol.rules) ? xCol.rules(xRow) : xCol.rules;
                _.each(zRules || defaultRules, (xRule) => {
                    if (errMsgs) return;
                    if (xRule.required && (!cell) ||
                        xRule.max && (_.isString(cell) && cell.length > xRule.max) ||
                        xRule.pattern && (!xRule.pattern.test(cell))
                    ) {
                        errMsgs += getErrMsg(xRowIndex, xRow.id, xCol.title, xRule.message);
                        return;
                    }
                    if (xRule.validator) promiseList.push({
                        func: () => xRule.validator({
                            field: xCol.dataIndex,
                            fullField: xCol.dataIndex,
                            type: typeof xRow[xCol.dataIndex],
                            ...xRule,
                        }, xRow[xCol.dataIndex], err => (err ? Promise.reject(err) : Promise.resolve()), xRow),
                        preMsg: getErrMsg(xRowIndex, xRow.id, xCol.title),
                    });
                });
            }
        });
    });
if (errMsgs) return Promise.reject(errMsgs);
    if (promiseList.length) {
        return _.reduce(promiseList, (pre, next, index) => pre.then(() => next.func().catch(v => Promise.reject(next.preMsg + v))), Promise.resolve());
    } else {
        return Promise.resolve();
    }
}