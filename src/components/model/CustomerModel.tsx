/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Customer } from "@/app/types";
import { MODE } from "@/app/types/enum";
import _ from "lodash";
import { customersAPI } from "@/lib/api";
import { Button, Col, Form, Input, Modal, Row, Space } from "antd";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

type Props = {
    reload: () => void
}

const CustomerDetail = forwardRef(({ reload }: Props, ref) => {

    const refDetail = useRef<any>(null);

    const [loading, setLoading] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    const refMode = useRef<{ data?: Customer; mode: string }>({
        data: undefined,
        mode: MODE.CREATE,
    });

    useImperativeHandle(ref, () => ({
        create: (_data: Customer) => {
        refMode.current = {
            data: _data,
            mode: MODE.CREATE,
        };
        setIsOpen(true);
        },
        update: (_data: Customer) => {
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
            title={refMode.current?.mode == MODE.CREATE ? 'Thêm khách hàng' : 'Cập nhật khách hàng'}
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
            <CustomerDetailForm
            ref={refDetail}
            setLoading={setLoading}
            reload={reload}
            closeModal={closeModal}
            />
        </Modal>
    </>
    )
});

CustomerDetail.displayName = "CustomerDetail";

export default CustomerDetail;

type FormProps = {
  reload: () => void;
  setLoading: (i: boolean) => void;
  closeModal: () => void;
};

const emptyParameter: Customer = {
    id: uuid(),
    name: '',
    phone: '',
    address: '',
};

type ErrorOption = {
  [key: string]: string | null;
};

const emptyValidate: ErrorOption = {
  name: null,
  phone: null,
};

type PropKey = keyof Customer;


const CustomerDetailForm = forwardRef(
  ({ setLoading, reload, closeModal }: FormProps, ref) => {
  
    const [mode, setMode] = useState<string>(MODE.CREATE);

    const [errors, setErrors] = useState<ErrorOption>(emptyValidate);

    const [param, setParam] = useState<Customer>(emptyParameter);

    const update = async (data: Customer) => {
      const _param: Customer = _.cloneDeep(data);
      setParam(_param);
      setMode(MODE.UPDATE);
    };

    const create = async () => {
      const _param: Customer = _.cloneDeep({
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
          case 'phone':
            _errors[prop] = null;
            if (!_setParam[prop]) {
              _errors[prop] = "Số điện thoại không được để trống";
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
          const res = await customersAPI.createCustomer(_payload);
          if (res) {
            reload();
            closeModal();
            resetData();
          }
        } else {
          const res = await customersAPI.updateCustomer(_payload.id, _payload);
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
      const _param: Customer = _.cloneDeep(param);
      (_param as any)[field] = value;
      setParam(_param);
      performValidate([field as PropKey], _param);
    }
    
    
    return (
      <Form layout="vertical">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Tên khách hàng"
              required
              validateStatus={errors['name'] ? 'error' : ''}
              help={errors['name']}
            >
              <Input
                value={param.name}
                placeholder="Tên khách hàng"
                onChange={(e) => onChange(e.target.value, "name")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Số điện thoại"
              required
              validateStatus={errors['phone'] ? 'error' : ''}
              help={errors['phone']}
            >
              <Input
                value={param.phone}
                placeholder="Số điện thoại"
                onChange={(e) => onChange(e.target.value, "phone")}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Địa chỉ"
            >
              <Input.TextArea
                value={param.address}
                style={{ width: '100%' }}
                placeholder="Địa chỉ"
                onChange={(e) => onChange(e.target.value, "address")}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  },
);

CustomerDetailForm.displayName = 'CustomerDetailForm';

export {CustomerDetailForm};

