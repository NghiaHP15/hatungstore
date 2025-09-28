/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Category, Product, ProductUnit } from "@/app/types";
import { MODE } from "@/app/types/enum";
import _ from "lodash";
import { categoriesAPI, productsAPI, uploadAPI } from "@/lib/api";
import { Button, Col, Form, Input, InputNumber, Modal, Popover, Row, Select, Space, Table } from "antd";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { UploadImage } from "../upload/upload-image";
import { publicId } from "../upload/utils";
import { v4 as uuid } from "uuid";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useDebounce } from "@/hooks/useDebounce";

type Props = {
    reload: () => void
}

const ProductDetail = forwardRef(({ reload }: Props, ref) => {

    const refDetail = useRef<any>(null);

    const [loading, setLoading] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    const refMode = useRef<{ data?: Category; mode: string }>({
        data: undefined,
        mode: MODE.CREATE,
    });

    useImperativeHandle(ref, () => ({
        create: (_data: Category) => {
        refMode.current = {
            data: _data,
            mode: MODE.CREATE,
        };
        setIsOpen(true);
        },
        update: (_data: Category) => {
        refMode.current = {
            data: _data,
            mode: MODE.UPDATE,
        };
        setIsOpen(true);
        },
    }));

    const afterOpenChange = (_open: boolean) => {
        if (_open) {
        if (refMode.current?.mode == MODE.CREATE) {
            refDetail.current.create(refMode.current?.data);
        }
        if (refMode.current?.mode == MODE.UPDATE) {
            refDetail.current.update(refMode.current?.data);
        }
        }
    };

    const closeModal = () => {
        setIsOpen(false);
        refDetail.current.reset();
    };

    const confirmClose = () => {
        setIsOpen(false);
    };

    const submitProject = () => {
        refDetail.current.submit();
    };


    return (
         <>
        <Modal
            title={refMode.current?.mode == MODE.CREATE ? 'Thêm sản phẩm' : 'Cập nhật sản phẩm'}
            open={isOpen}
            onCancel={closeModal}
            afterOpenChange={afterOpenChange}
            styles={{
            body: { flexGrow: 1 },
            content: { display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}}
            width="800px"
            centered
            footer={[
                <Space key={"actions"} className="pr-3">
                    <Button
                    key="submit"
                    type="primary"
                    onClick={submitProject}
                    loading={loading}
                    disabled={loading}
                    >Lưu</Button>
                    <Button 
                    key="close-request" 
                    loading={loading} 
                    onClick={confirmClose}
                    disabled={loading}
                    >Đóng</Button>
                </Space>
            ]}
        >
            <ProductDetailForm
            ref={refDetail}
            setLoading={setLoading}
            reload={reload}
            closeModal={closeModal}
            />
        </Modal>
    </>
    )
});

ProductDetail.displayName = "ProductDetail";

export default ProductDetail;

type FormProps = {
  reload: () => void;
  setLoading: (i: boolean) => void;
  closeModal: () => void;
};

const emptyParameter: Product = {
    id: uuid(),
    name: "",
    image_url: "",
    units: [],
    category_id: "",
};

const emptyUnit: ProductUnit = {
    id: uuid(),
    name: "",
    unit_name: "",
    price: 0,
    product_id: "",
};

type ErrorOption = {
  [key: string]: string | null;
};

const emptyValidate: ErrorOption = {
  name: null,
  category_id: null,
};

type PropKey = keyof Product;

type PropUnitKey = keyof ProductUnit;


const ProductDetailForm = forwardRef(
  ({ setLoading, reload, closeModal }: FormProps, ref) => {
  
    const [mode, setMode] = useState<string>(MODE.CREATE);

    const [errors, setErrors] = useState<ErrorOption>(emptyValidate);

    const [categories, setCategories] = useState<Category[]>([]);

    const [loadImge, setLoadImage] = useState<boolean>(false);

    const [param, setParam] = useState<Product>(emptyParameter);

    const [category, setCategory] = useState<string>("");

    const [show, setShow] = useState<boolean>(false);

    const [load, setLoad] = useState<boolean>(false);

    const [searchCategory, setSearchCategory] = useState<string>('');

    const deboundedCategory = useDebounce(searchCategory, 500);

    useEffect(()=>{
        const fetchCategory = async () => {
            try {
                const response = await categoriesAPI.getCategories({ search: deboundedCategory });
                if (!response.data.categories) return;
                setCategories(response.data.categories);
            } catch (error) {
                console.log(error);
            }
        }
        fetchCategory();
    },[param.category_id, deboundedCategory]);

    const update = async (data: Product) => {
      const _param: Product = _.cloneDeep(data);
      setParam(_param);
      setMode(MODE.UPDATE);
    };

    const create = async () => {
      const _param: Product = _.cloneDeep({
        ...emptyParameter,
      });
      setParam(_param);
      setMode(MODE.CREATE);
    };

    useImperativeHandle(ref, () => ({
      create: create,

      update: update,

      submit: submitProject,

      reset: resetData,
    }));

    const performValidate = async (props: PropKey[], _currentParam: any) => {
      const _errors: ErrorOption = _.cloneDeep(errors);
      const _setParam = _currentParam ? _currentParam : param;
      if (props.length === 0) {
        for (const property in _errors) {
          props.push(property as PropKey);
        }
      }
      props.forEach((prop) => {
        switch (prop) {
          case 'name':
            _errors[prop] = null;
            if (!_setParam[prop]) {
              _errors[prop] = "Tên sản phẩm không được để trống";
            }
            break;
          case 'category_id':
            _errors[prop] = null;
            if (!_setParam[prop]) {
              _errors[prop] = "Danh mục không được để trống";
            }
            break;
          default:
            break;
        }
      });

      setErrors(_errors);

      let isValid = true;
      for (const key in _errors) {
        if (_errors[key]) {
          isValid = false;
        }
      }
      return isValid;
    };

    const submitProject = async () => {
      const _payload: any = _.cloneDeep(param);
      const isValid = await performValidate([], _payload);
      if(!isValid) return;
      setLoading(true);
      try {
        if (mode === MODE.CREATE) {
          const res = await productsAPI.createProduct(_payload);
          if (res) {
            reload();
            closeModal();
            resetData();
          }
        } else {
          const res = await productsAPI.updateProduct(_payload.id, _payload);
          if (res) {
            reload();
            closeModal();
            resetData();
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    const resetData = () => {
      setParam(emptyParameter);
    };

    const onChange = (value: string | boolean | null, field: PropKey) => {
      const _param: Product = _.cloneDeep(param);
      (_param as any)[field] = value;
      setParam(_param);
      performValidate([field as PropKey], _param);
    }
    
    const onAddUnit = () => {
        const _param: Product = _.cloneDeep(param);
        _param.units?.push({ ...emptyUnit, id: uuid(), product_id: _param.id});
        setParam(_param);
    }

    const onDeleteUnit = (record: ProductUnit) => {
        const _param: Product = _.cloneDeep(param);
        _param.units = _param.units?.filter((item) => item.id !== record.id);
        setParam(_param);
    }

    const onChangeUnit = (value: number | string | null, field: PropUnitKey, index: number) => {
        const _param: Product = _.cloneDeep(param);
        (_param.units as any)[index][field] = value;
        setParam(_param);
    }

    const addCategory = async () => {
        try {
            setLoad(true);
            const res = await categoriesAPI.createCategory({ name: category });
            console.log(res);
            
            if (res.data) {
                const _param: Product = _.cloneDeep(param);
                _param.category_id = res.data.id;
                setParam(_param);
                setCategory("");
                setShow(false);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoad(false);
        }
    }

    return (
      <Form layout="vertical">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Nhóm sản phẩm"
              required
              validateStatus={errors['name'] ? 'error' : ''}
              help={errors['name']}
            >
              <Input
                value={param.name}
                placeholder="Nhóm sản phẩm"
                onChange={(e) => onChange(e.target.value, "name")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Danh mục"
              required
              validateStatus={errors['category_id'] ? 'error' : ''}
              help={errors['category_id']}
            >
              <div className="flex items-center gap-2">
                <Select
                value={param.category_id}
                showSearch
                filterOption={false}
                onSearch={(e) => setSearchCategory(e)}
                fieldNames={{ label: 'name', value: 'id' }}
                options={categories || []}
                placeholder="Danh mục"
                onChange={(value) => onChange(value, "category_id")}
              />
              <Popover
                trigger={"click"}
                title="Thêm danh mục"
                placement="bottomRight"
                open={show}
                onOpenChange={setShow}
                content={
                  <div className="flex items-center gap-2">
                    <Input placeholder="Tên danh mục" className="w-[250px]!" value={category} onChange={(e) => setCategory(e.target.value)} />
                    <Button loading={load} type="primary" disabled={!category} onClick={addCategory}>Thêm</Button>
                  </div>
                }
              >
                <Button icon={<PlusOutlined />} type="primary" />
              </Popover>
              </div>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Sản phẩm"
            >
                {param.units?.length === 0 ? (
                    <>
                    <div className="flex items-center justify-center bg-gray-50 p-2 text-gray-400 font-roboto">
                        <span className="">Chưa có sản phẩm:</span>
                        <Button type="link" className="text-blue-500 underline cursor-pointer" onClick={() => onAddUnit()}>Thêm mới</Button>
                    </div>
                    </>
                ): (
                    <Table
                        key="id"
                        columns={[
                          {
                            title: 'Tên sản phẩm',
                            dataIndex: 'name',
                            render: (text: string, record: ProductUnit, index: number) =>
                              <Input size="large" value={record.name} onChange={(e) => onChangeUnit(e.target.value, 'name', index)} className="w-full" />
                          },
                          {
                            title: 'Đơn vị tính',
                            dataIndex: 'unit_name',
                            render: (text: string, record: ProductUnit, index: number) =>
                              <Input size="large" value={record.unit_name} onChange={(e) => onChangeUnit(e.target.value, 'unit_name', index)} className="w-full!" />
                          },
                          {
                            title: 'Giá',
                            width: 150,
                            dataIndex: 'price',
                            render: (text: string, record: ProductUnit, index: number) => 
                              <InputNumber step={1000} min={0} size="large" suffix="đ" value={record.price} onChange={(value) => onChangeUnit(value, 'price', index)} className="w-full!" />
                          },
                          {
                            title: <Button icon={<PlusOutlined className="text-blue-500!" />} type="dashed" size="small" onClick={() => onAddUnit()} />,
                            width: 50,
                            align: 'center',
                            dataIndex: 'action',
                            render: (text: string, record: ProductUnit) => 
                            <Button type="link" icon={<DeleteOutlined className="text-red-500!" />} size="small" onClick={() => onDeleteUnit(record)} />,
                          }
                        ]}
                        size="small"
                        dataSource={param.units}
                        pagination={false}
                    />
                )}
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item
              label="Hình ảnh"
            >
                <UploadImage
                    loading={loadImge}
                    defaultImage={param.image_url || ""}
                    customRequest={async ({ file, onSuccess, onError}) => {
                    try{
                        setLoadImage(true);
                        const formData = new FormData();
                        formData.append('image', file as Blob);
                        if(param.image_url) {
                        const id = publicId(param.image_url);
                        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                        id && await uploadAPI.deleteImage(id);
                        }
                        const res = await uploadAPI.uploadImage(formData);
                        if(res){
                        onChange(res.data.url, "image_url");
                        onSuccess?.(res, file as any);
                        }
                    } catch (error) {
                    onError?.(error as any); 
                    } finally {
                        setLoadImage(false);
                    }
                    }} 
                />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  },
);

ProductDetailForm.displayName = 'ProductDetailForm';

export {ProductDetailForm};

