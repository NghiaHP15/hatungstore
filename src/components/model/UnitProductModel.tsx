/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Product, UnitProduct } from "@/app/types";
import { MODE } from "@/app/types/enum";
import _ from "lodash";
import { productsAPI, productunitsAPI } from "@/lib/api";
import { Button, Col, Form, Image, Input, InputNumber, Modal, Row, Select, Space } from "antd";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { no_image } from "@/images";
import { useDebounce } from "@/hooks/useDebounce";

type Props = {
    reload: () => void
}

const ProductUnitDetail = forwardRef(({ reload }: Props, ref) => {

    const refDetail = useRef<any>(null);

    const [loading, setLoading] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    const refMode = useRef<{ data?: UnitProduct; mode: string }>({
        data: undefined,
        mode: MODE.CREATE,
    });

    useImperativeHandle(ref, () => ({
        create: (_data: UnitProduct) => {
        refMode.current = {
            data: _data,
            mode: MODE.CREATE,
        };
        setIsOpen(true);
        },
        update: (_data: UnitProduct) => {
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
            title={refMode.current?.mode == MODE.CREATE ? 'Thêm danh mục' : 'Cập nhật danh mục'}
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
            <ProductUnitDetailForm
            ref={refDetail}
            setLoading={setLoading}
            reload={reload}
            closeModal={closeModal}
            />
        </Modal>
    </>
    )
});

ProductUnitDetail.displayName = "ProductUnitDetail";

export default ProductUnitDetail;

type FormProps = {
  reload: () => void;
  setLoading: (i: boolean) => void;
  closeModal: () => void;
};

const emptyParameter: UnitProduct = {
    id: uuid(),
    name: '',
    unit_name: '',
    price: 0,
    product_id: '',
};

type ErrorOption = {
  [key: string]: string | null;
};

const emptyValidate: ErrorOption = {
  name: null,
  unit_name: null,
  price: null,
  product_id: null,
};

type PropKey = keyof UnitProduct;


const ProductUnitDetailForm = forwardRef(
  ({ setLoading, reload, closeModal }: FormProps, ref) => {
  
    const [mode, setMode] = useState<string>(MODE.CREATE);

    const [errors, setErrors] = useState<ErrorOption>(emptyValidate);

    const [param, setParam] = useState<UnitProduct>(emptyParameter);

    const [searchProduct, setSearchProduct] = useState<string>('');

    const deboundedProduct = useDebounce(searchProduct, 500);

    const [products, setProducts] = useState<Product[]>([]);

    const update = async (data: UnitProduct) => {
      const _param: UnitProduct = _.cloneDeep(data);
      setParam(_param);
      setMode(MODE.UPDATE);
    };

    const create = async () => {
      const _param: UnitProduct = _.cloneDeep({
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

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await productsAPI.getProducts({ limit: 1000, search: deboundedProduct });
                if (res.data.products) {
                    setProducts(res.data.products);
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchProducts();
    },[deboundedProduct])

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
          case 'unit_name':
            _errors[prop] = null;
            if (!_setParam[prop]) {
              _errors[prop] = "Tên đơn vị không được để trống";
            }
            break;
          case 'price':
            _errors[prop] = null;
            if (!_setParam[prop]) {
            _errors[prop] = "Giá không được để trống";
            }
            break;
          case 'product_id':
            _errors[prop] = null;
            if (!_setParam[prop]) {
            _errors[prop] = "Sản phẩm không được để trống";
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
          const res = await productunitsAPI.createProductUnit(_payload);
          if (res) {
            reload();
            closeModal();
            resetData();
          }
        } else {
          const res = await productunitsAPI.updateProductUnit(_payload.id, _payload);
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

    const onChange = (value: string | number | null, field: PropKey) => {
      const _param: UnitProduct = _.cloneDeep(param);
      (_param as any)[field] = value;
      setParam(_param);
      performValidate([field as PropKey], _param);
    }
    
    
    return (
      <Form layout="vertical">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Tên mặt hàng"
              required
              validateStatus={errors['name'] ? 'error' : ''}
              help={errors['name']}
            >
              <Input
                value={param.name}
                placeholder="Tên mặt hàng"
                onChange={(e) => onChange(e.target.value, "name")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Sản phẩm"
              required
              validateStatus={errors['product_id'] ? 'error' : ''}
              help={errors['product_id']}
            >
              <Select
                value={param.product_id}
                placeholder="Sản phẩm"
                showSearch
                filterOption={false}
                onSearch={(e) => setSearchProduct(e)}
                optionRender={(option) => {
                    const item: any = option.data;
                    return (
                      <div className='flex items-center gap-2'>
                        <Image
                          src={item.image_url || no_image}
                          width={30}
                          height={30}
                          className='rounded-md'
                          preview={false}
                        />
                        <div className='flex flex-col'>
                          <span>{item.name}</span>
                        </div>
                      </div>
                    )
                }}
                options={products || []}
                fieldNames={{ label: 'name', value: 'id' }}
                onChange={(e) => onChange(e, "product_id")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tên đơn vị"
              required
              validateStatus={errors['unit_name'] ? 'error' : ''}
              help={errors['unit_name']}
            >
              <Input
                value={param.unit_name}
                placeholder="Tên đơn vị"
                onChange={(e) => onChange(e.target.value, "unit_name")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Giá đơn vị"
              required
              validateStatus={errors['price'] ? 'error' : ''}
              help={errors['price']}
            >
              <InputNumber
                value={param.price}
                style={{ width: '100%' }}
                controls={false}
                suffix="đ"
                placeholder="Giá đơn vị"
                onChange={(e) => onChange(e, "price")}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  },
);

ProductUnitDetailForm.displayName = 'ProductUnitDetailForm';

export {ProductUnitDetailForm};

