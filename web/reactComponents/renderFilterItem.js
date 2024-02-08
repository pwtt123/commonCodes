const zDefaultRules: any = [];
const zCompReg = /\$[^\$]+\$/g;
const defaultFormat = 'YYYY-MM-DD';
const getFormType = (
  { type = '', options = {}, props = {}, format = defaultFormat }: any,
  xCallback?: any
) => {
  if (!xCallback) xCallback = () => {};
  let zRender;
  //   <span dangerouslySetInnerHTML={{ __html: v.name }} />
  switch (type) {
    case 'radio':
      zRender = (
        <Radio.Group {...props} onChange={xCallback}>
          {_.map(options, (v) => (
            <Radio value={v.id}>{v.name}</Radio>
          ))}
        </Radio.Group>
      );
      break;
    case 'select':
      zRender = <Select {...props} dictData={options} onChange={xCallback} />;
      break;
    case 'datePicker':
      zRender = (
        <DatePicker
          {...props}
          dictData={options}
          onChange={(v: any, s: any) => xCallback(v.format(format))}
        />
      );
      break;
    default:
      zRender = <Input {...props} onChange={(e) => xCallback(e.target.value)} />;
  }
  return zRender;
};
const renderFilterItem = (xItem: any, compFormCallback: any) => {
  const zOptions = _.map(xItem.options, (xOp) => {
    // 替换name中$xx$为comps中定义的表单
    if (zCompReg.test(xOp.name)) {
      const zMatch = xOp.name.match(zCompReg);
      const zSplit = xOp.name.split(zCompReg);
      const zRender = [];
      for (var i = 0; i < zMatch.length + zSplit.length; i++) {
        if (i % 2) {
          const zKey = zMatch[Math.floor(i / 2)];
          if (!xItem.comps[zKey]) continue;
          zRender.push(
            <Form.Item {...xItem.comps[zKey].formProps} style={{ display: 'inline-block' }} key={i}>
              {getFormType(xItem.comps[zKey], (v: any) => compFormCallback(zKey, v))}
            </Form.Item>
          );
        } else {
          zRender.push(
            <div style={{ display: 'inline-block' }} key={i}>
              {zSplit[Math.floor(i / 2)]}
            </div>
          );
        }
      }
      xOp.name = zRender;
    }
    return xOp;
  });
  xItem.options = zOptions;
  return getFormType(xItem);
};
const AchieveFilterModalProps: React.FC<AchieveFilterModalProps> = ({
  filterList,
  onConfirm,
  onCancel,
  initialValues,
}) => {
  const formRef = useRef<any>();
  // 动态表单的值 {startTime:{$1$:"2022-10-11",$2$:"3"},...}
  const [compFormValues, setCompFormValues] = useState<any>({});
  const [renderList, setRenderList] = useState<any>(filterList);
  useEffect(() => {
    // 存在 optionsUrlParams 远程获取options替换原来的
    let zQueryLlist: any = [];
    let zNew = _.clone(filterList);
    _.each(zNew, (xFilter) => {
      if (!_.isEmpty(xFilter.optionsUrlParams)) {
        let formData = new FormData();
        formData.append('srcId', xFilter.optionsUrlParams.id);
        formData.append('sqlSen', xFilter.optionsUrlParams.sqlSen);
        const params = formDataToObject(formData);
        zQueryLlist.push({ id: xFilter.id, params });
      }
    });
    Promise.all(_.map(zQueryLlist, (v) => getFormOptions(v.params))).then((resList: any) => {
      _.each(zQueryLlist, (v, index) => {
        _.find(zNew, { id: v.id }).options = resList[index].data.options;
      });
      setRenderList(zNew);
    });
  }, []);
  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };
  const onCompFormChange = (xId: any, xKey: any, xV: any) => {
    setCompFormValues((xPre: any) => {
      let zNew = { ...xPre };
      if (!zNew[xId]) zNew[xId] = {};
      zNew[xId][xKey] = xV;
      return zNew;
    });
  };
  return (
    <Form
      {...layout}
      name="basic"
      ref={formRef}
      initialValues={initialValues}
      onFinish={(xForm: any) => {
        const zForm = { ...xForm };
        // 日期格式转换
        _.each(renderList, (xItem) => {
          if (xItem.type == 'datePicker' && zForm[xItem.id])
            zForm[xItem.id] = zForm[xItem.id].format(xItem.format || defaultFormat);
          //  多选select 数组 改为 逗号分隔 带单引号的字符串
          if (xItem.type == 'select' && _.isArray(zForm[xItem.id])) {
            if (zForm[xItem.id].length > 1) {
              zForm[xItem.id] = _.map(zForm[xItem.id], (v) => `'${v}'`).join(',');
            } else {
              zForm[xItem.id] = String(zForm[xItem.id]);
            }
          }
        });
        // $xx$替换符转换
        _.each(zForm, (v, id) => {
          if (zCompReg.test(v)) {
            zForm[id] = v.replace(zCompReg, (k: any) =>
              compFormValues[id] ? compFormValues[id][k] : ''
            );
          }
        });
        onConfirm(zForm, xForm, renderList, filterList);
      }}>
      {_.map(renderList, (xItem) => {
        return (
          <>
            <Divider orientation="left">{xItem.name}</Divider>
            <Form.Item rules={zDefaultRules} name={xItem.id} {...xItem.formProps}>
              {renderFilterItem(xItem, (k: any, v: any) => onCompFormChange(xItem.id, k, v))}
            </Form.Item>
          </>
        );
      })}
<div className="modal-button-area">
        <Button type="primary" htmlType="submit">
          确定
        </Button>
        <Button onClick={onCancel}>取消</Button>
      </div>
    </Form>
  );
};