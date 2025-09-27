/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { UploadImage } from "@/components/upload/upload-image";
import { publicId } from "@/components/upload/utils";
import { storeAPI, uploadAPI } from "@/lib/api";
import { CloseOutlined, FormOutlined } from "@ant-design/icons";
import { Button, Input, theme } from "antd";
import React, { useEffect, useState } from "react";

const emptyData: Record<string, string> = {
  store: "",
  address: "",
  phone: "",
  email: "",
  owner: "",
  name_bank: "",
  number_bank: "",
  account_bank: "",
  qr_code: "",
}

const SettingPage = () => {
  const [data, setData] = useState<Record<string, string>>(emptyData);
  const [loadImge, setLoadImage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [edit, setEdit] = useState<Record<string, boolean>>({
    store: false,
    address: false,
    phone: false,
    email: false,
    owner: false,
    name_bank: false,
    number_bank: false,
    account_bank: false,
  })
  const { token: { colorPrimary } } = theme.useToken();

  useEffect(() => {
    const getData = async () => {
      try{
        const res = await storeAPI.getStore();
        if(res.data)
        setData(res.data);
      } catch (error) {
        console.error(error);
      }
    }
    getData();
  }, [])

  const submit = async () => {
    try{
      setLoading(true);
      const res = await storeAPI.updateStore(data);
      if(res.data)
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-5 gap-6 font-roboto bg-gray-50 p-5 rounded-md ">
        <div className="col-span-5">
          <h1 className="text-xl ">Thông tin chung</h1>
        </div>
        <div className="col-span-2 flex flex-col gap-2 text-base">
          <div className="flex items-center gap-2 ">
            <span className="">Tên cửa hàng:</span>
            {edit.store ? (
              <Input type="text" suffix={<CloseOutlined style={{color: colorPrimary}} onClick={() => setEdit({...edit, store: false})}/>} value={data.store} onChange={(e) => setData({ ...data, store: e.target.value })} />
            ): (
            <div className="flex items-center">
              <span>{data.store}</span>
              <Button type="link" icon={<FormOutlined style={{color: colorPrimary}}/>} onClick={() => setEdit({...edit, store: true})} />
            </div>
            )}
          </div>
          <div className="flex items-center gap-2 ">
            <span className="">Địa chỉ:</span>
            {edit.address ? (
              <Input type="text" suffix={<CloseOutlined style={{color: colorPrimary}} onClick={() => setEdit({...edit, address: false})}/>} value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} />
            ): (
            <div className="flex items-center">
              <span>{data.address}</span>
              <Button type="link" icon={<FormOutlined style={{color: colorPrimary}}/>} onClick={() => setEdit({...edit, address: true})} />
            </div>
            )}
          </div>
          <div className="flex items-center gap-2 ">
            <span className="">Số điện thoại:</span>
            {edit.phone ? (
              <Input type="text" suffix={<CloseOutlined style={{color: colorPrimary}} onClick={() => setEdit({...edit, phone: false})}/>} value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
            ): (
            <div className="flex items-center">
              <span>{data.phone}</span>
              <Button type="link" icon={<FormOutlined style={{color: colorPrimary}}/>} onClick={() => setEdit({...edit, phone: true})} />
            </div>
            )}
          </div>
          <div className="flex items-center gap-2 ">
            <span className="">Email:</span>
            {edit.email ? (
              <Input type="text" suffix={<CloseOutlined style={{color: colorPrimary}} onClick={() => setEdit({...edit, email: false})}/>} value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
            ): (
            <div className="flex items-center">
              <span>{data.email}</span>
              <Button type="link" icon={<FormOutlined style={{color: colorPrimary}}/>} onClick={() => setEdit({...edit, email: true})} />
            </div>
            )}
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-2 text-base">
          <div className="flex items-center gap-2 ">
            <span className="">Chủ sở hữu:</span>
            {edit.owner ? (
              <Input type="text" suffix={<CloseOutlined style={{color: colorPrimary}} onClick={() => setEdit({...edit, owner: false})}/>} value={data.owner} onChange={(e) => setData({ ...data, owner: e.target.value })} />
            ): (
            <div className="flex items-center">
              <span>{data.owner}</span>
              <Button type="link" icon={<FormOutlined style={{color: colorPrimary}}/>} onClick={() => setEdit({...edit, owner: true})} />
            </div>
            )}
          </div>
          <div className="flex items-center gap-2 ">
            <span className="">Tên ngân hàng:</span>
            {edit.name_bank ? (
              <Input type="text" suffix={<CloseOutlined style={{color: colorPrimary}} onClick={() => setEdit({...edit, name_bank: false})}/>} value={data.name_bank} onChange={(e) => setData({ ...data, name_bank: e.target.value })} />
            ): (
            <div className="flex items-center">
              <span>{data.name_bank}</span>
              <Button type="link" icon={<FormOutlined style={{color: colorPrimary}}/>} onClick={() => setEdit({...edit, name_bank: true})} />
            </div>
            )}
          </div>
          <div className="flex items-center gap-2 ">
            <span className="">Tên tài khoản:</span>
            {edit.number_bank ? (
              <Input type="text" suffix={<CloseOutlined style={{color: colorPrimary}} onClick={() => setEdit({...edit, number_bank: false})}/>} value={data.number_bank} onChange={(e) => setData({ ...data, number_bank: e.target.value })} />
            ): (
            <div className="flex items-center">
              <span>{data.number_bank}</span>
              <Button type="link" icon={<FormOutlined style={{color: colorPrimary}}/>} onClick={() => setEdit({...edit, number_bank: true})} />
            </div>
            )}
          </div>
          <div className="flex items-center gap-2 ">
            <span className="">Số tài khoản:</span>
            {edit.account_bank ? (
              <Input type="text" suffix={<CloseOutlined style={{color: colorPrimary}} onClick={() => setEdit({...edit, account_bank: false})}/>} value={data.account_bank} onChange={(e) => setData({ ...data, account_bank: e.target.value })} />
            ): (
            <div className="flex items-center">
              <span>{data.account_bank}</span>
              <Button type="link" icon={<FormOutlined style={{color: colorPrimary}}/>} onClick={() => setEdit({...edit, account_bank: true})} />
            </div>
            )}
          </div>
        </div>
        <div className="col-span-1 flex flex-col gap-2 text-base">
          <div className="flex items-start gap-2">
            <span className="">Qr code:</span>
            <UploadImage
              loading={loadImge}
              defaultImage={data.qr_code || ""}
              customRequest={async ({ file, onSuccess, onError}) => {
              try{
                  setLoadImage(true);
                  const formData = new FormData();
                  formData.append('image', file as Blob);
                  if(data.qr_code) {
                  const id = publicId(data.qr_code);
                  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                  id && await uploadAPI.deleteImage(id);
                  }
                  const res = await uploadAPI.uploadImage(formData);
                  if(res){
                  setData({ ...data, qr_code: res.data.url });
                  onSuccess?.(res, file as any);
                  }
              } catch (error) {
              onError?.(error as any); 
              } finally {
                  setLoadImage(false);
              }
              }} 
            />
          </div>
        </div>
        <div className="col-span-3 flex justify-end">
          <Button type="primary" onClick={submit} loading={loading}>Cập nhật</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingPage;
