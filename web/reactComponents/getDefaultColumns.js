//
const getDefaultColumns = (xCols, xPdataIndexList, xComupterList) => {
    return _.map(xCols, (col, index) => {
        // 父列和子列dataIndex 不能重复
        if (xComupterList && _.isFunction(col.computer)) xComupterList[col.dataIndex] = col.computer;
        const zWidth = columnWidthList[(xPdataIndexList || "") + col.dataIndex] || col.width;
        return ({
            ...col,
            width: zWidth,
            children: col.children ? getDefaultColumns(col.children, (xPdataIndexList || "") + col.dataIndex, xComupterList) : undefined,
            onCell: (record, rowIndex) => {
                const zValue = col.formatterValue ? col.formatterValue(record[col.dataIndex]) : record[col.dataIndex];
                return ({
                    ...col,
                    width: zWidth,
                    record: { ...record, [col.dataIndex]: zValue },
                    pageType: props.tableType,
                    editingCellRef,
                    rowIndex,
                    value: zValue,
                    handleSave: (xRow) => {
                        if (col.parseValue) xRow[col.dataIndex] = col.parseValue(xRow[col.dataIndex]);
                        handleSave(xRow, col.dataIndex, rowIndex);
                    },
                });
            },
            onHeaderCell: column => ({
                width: column.width,
                onResize: handleResize(col.dataIndex, xPdataIndexList),
            }),
        });
    });
};
