const TableEditFormItem = ({ column, record, value }) => {
    // 表单会自动覆盖value以及onChange,定义仅为了符合接口
    return (<>{(!column.editShow || column.editShow(record)) &&
        <Col span={column.formSpan || 12} >
            <Form.Item
                name={column.dataIndex}
                label={column.title}
                rules={column.rules || defaultRules}
            \>
                {column.editor ? column.editor({ value, record }, () => { }) : <Input.TextArea />}
            </Form.Item>
        </Col >
    }</>);
};
// 表格一行数据编辑modal
const TableRowEditModal = (props) => {
    let sourceRecord = _.clone(props.record);
    // 需要联动校验 不能clone
    let zRecord = props.record;
    _.each(props.columns, col => {
        if (col.formatterValue) zRecord[col.dataIndex] = col.formatterValue(zRecord[col.dataIndex]);
    });
    const [formValue, setFormValue] = useState(zRecord);
    const formRef = React.useRef();
    const onSave = async () => {
        let value = await formRef.current.validateFields();
        _.each(props.columns, col => {
            if (col.parseValue) value[col.dataIndex] = col.parseValue(value[col.dataIndex]);
        });
        if (_.isFunction(props.onChange)) props.onChange(value);
        if (_.isFunction(props.onClose)) props.onClose();
    };
    const formItemLayout = {
        labelCol: {
            xs: { span: 24 },
            sm: { span: 7 },
        },
        wrapperCol: {
            xs: { span: 24 },
            sm: { span: 17 },
        },
    };
    let formItems = [];
    _.each(props.columns, (xCol) => {
        if (xCol.editable) formItems.push(<TableEditFormItem value={sourceRecord[xCol.dataIndex]} column={xCol} record={formValue} />);
    });
    return (<>
        <Form
            ref={formRef}
            {...formItemLayout}
            onValuesChange={(v) => {
                let newFormValue = { ...formValue, ...v };
                setFormValue(newFormValue);
            }}
            initialValues={{
                ...formValue,
            }}
        \>
            <Row gutter={50} >
                {formItems}
            </Row>
        </Form >
        <Row>
            <Col span={20} />
            <Col span={4}>
                <Form.Item>
                    <Button style={{ marginLeft: '2%' }} onClick={props.onClose}  >
                        取消
                           </Button>
                    <Button
                        style={{ marginLeft: '2%' }}
                        type="primary"
                        onClick={() => onSave()}
                    \>
                        保存
                    </Button>
                </Form.Item>
            </Col>
        </Row>
    </>);
};