/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { User } from "@/app/types";
import { MODE } from "@/app/types/enum";
import _ from "lodash";
import { usersAPI } from "@/lib/api";
import { Button, Col, Form, Input, Modal, Row, Select, Space } from "antd";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";

type Props = {
    reload: () => void
}

const UserDetail = forwardRef(({ reload }: Props, ref) => {

    const refDetail = useRef<any>(null);

    const [loading, setLoading] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    const refMode = useRef<{ data?: User; mode: string }>({
        data: undefined,
        mode: MODE.CREATE,
    });

    useImperativeHandle(ref, () => ({
        create: (_data: User) => {
        refMode.current = {
            data: _data,
            mode: MODE.CREATE,
        };
        setIsOpen(true);
        },
        update: (_data: User) => {
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
            title={refMode.current?.mode == MODE.CREATE ? 'Thêm người dùng' : 'Cập nhật người dùng'}
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
            <UserDetailForm
            ref={refDetail}
            setLoading={setLoading}
            reload={reload}
            closeModal={closeModal}
            />
        </Modal>
    </>
    )
});

UserDetail.displayName = "UserDetail";

export default UserDetail;

type FormProps = {
  reload: () => void;
  setLoading: (i: boolean) => void;
  closeModal: () => void;
};

const emptyParameter: User = {
    id: uuid(),
    full_name: '',
    role: 'cashier',
    email: '',
    password: '123456',
};

type ErrorOption = {
  [key: string]: string | null;
};

const emptyValidate: ErrorOption = {
  full_name: null,
  role: null,
  email: null,
};

type PropKey = keyof User;


const UserDetailForm = forwardRef(
  ({ setLoading, reload, closeModal }: FormProps, ref) => {
  
    const [mode, setMode] = useState<string>(MODE.CREATE);

    const [errors, setErrors] = useState<ErrorOption>(emptyValidate);

    const [param, setParam] = useState<User>(emptyParameter);

    const [show, setShow] = useState<boolean>(false);

    const update = async (data: User) => {
      const _param: User = _.cloneDeep(data);
      setParam(_param);
      setMode(MODE.UPDATE);
    };

    const create = async () => {
      const _param: User = _.cloneDeep({
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
          case 'email':
            _errors[prop] = null;
            if (!_setParam[prop]) {
              _errors[prop] = "Email không được để trống";
            }
            break;
          case 'full_name':
            _errors[prop] = null;
            if (!_setParam[prop]) {
              _errors[prop] = "Tên người dùng không được để trống";
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
          const res = await usersAPI.createUser(_payload);
          if (res) {
            reload();
            closeModal();
            resetData();
          }
        } else {
          const res = await usersAPI.updateUser(_payload.id, _payload);
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
      const _param: User = _.cloneDeep(param);
      (_param as any)[field] = value;
      setParam(_param);
      performValidate([field as PropKey], _param);
    }
    
    
    return (
      <Form layout="vertical">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="Email"
              required
              validateStatus={errors['email'] ? 'error' : ''}
              help={errors['email']}
            >
              <Input
                value={param.email}
                disabled={mode === MODE.UPDATE}
                type="email"
                placeholder="Nhập email"
                onChange={(e) => onChange(e.target.value, "email")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Họ tên"
              required
              validateStatus={errors['full_name'] ? 'error' : ''}
              help={errors['full_name']}
            >
              <Input
                value={param.full_name}
                placeholder="Họ tên"
                onChange={(e) => onChange(e.target.value, "full_name")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Vai trò"
            >
              <Select
                value={param.role}
                options={[{ label: 'Admin', value: 'admin' }, { label: 'Manager', value: 'manager' }, { label: 'Cashier', value: 'cashier' }]}
                onChange={(e) => onChange(e, "role")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Mật khẩu"
            >
              <Input
                value={param.password}
                type={show ? 'text' : 'password'}
                placeholder="Mật khẩu"
                suffix={show ? <EyeOutlined onClick={() => setShow(false)} /> : <EyeInvisibleOutlined onClick={() => setShow(true)} />}
                onChange={(e) => onChange(e.target.value, "password")}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  },
);

UserDetailForm.displayName = 'UserDetailForm';

export {UserDetailForm};

