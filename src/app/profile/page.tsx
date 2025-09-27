/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { User } from "../types";
import { useEffect, useState } from "react";
import { Button, Input, theme } from "antd";
import { FormOutlined } from "@ant-design/icons";
import { authAPI } from "@/lib/api";

const ProductPage = () => {
    const [data, setData] = useState<User>({ full_name: "", email: "", role: "cashier", id: "", password: "" });
    const [editFullName, setEditFullName] = useState<boolean>(false);
    const [editPassword, setEditPassword] = useState<boolean>(false);
    const [showPassword, ] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const { user, signOut } = useAuth();
    const { token: { colorPrimary } } = theme.useToken();

    useEffect(() => {
        if (user) {
            setData({
                full_name: user.full_name || "",
                email: user.email,
                role: user.role || "cashier" as any,
                id: user.id,
            });
        }
    }, [user]);

    const submit = async () => {
        try {
            setLoading(true);
            const res = await authAPI.updateProfile(data);
            if(res?.data){
                signOut();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setEditFullName(false);
        setEditPassword(false);
    };
   
    return (
        <DashboardLayout>
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                    <div className="flex flex-col gap-3 font-roboto text-base p-6 bg-gray-50 rounded-md">
                        <span className="border-l-3 border-red-400 pl-3">Thông tin tài khoản</span>
                        <span className="cursor-pointer" onClick={signOut}>Đăng xuất</span>
                    </div>
                </div>
                <div className="col-span-8">
                    <div className="p-6 bg-gray-50 rounded-md ">
                        <h1 className="font-roboto text-lg mb-4">Thông tin cá nhân</h1>
                        <div className="flex flex-col gap-4 text-base font-roboto">
                            <div className="flex items-center">
                                <label className="w-[100px]">Họ tên:</label>
                                {
                                    editFullName ? (
                                        <Input type="text" value={data.full_name} onChange={(e) => setData({ ...data, full_name: e.target.value })} />
                                    ) : (
                                        <div className="flex items-center">
                                            <span>{data.full_name}</span>
                                            <Button type="link" icon={<FormOutlined style={{color: colorPrimary}}/>} onClick={() => setEditFullName(true)} />
                                        </div>
                                    )
                                }
                            </div>
                            <div className="flex items-center">
                                <label className="w-[100px]">Email:</label>
                                <span>{data.email}</span>
                            </div>
                            <div className="flex items-center">
                                <label className="w-[100px]">Vai trò:</label>
                                <span>{data.role}</span>
                            </div>
                            <div className="flex items-center">
                                <label className="w-[100px]">Mật khẩu:</label>
                                {
                                    editPassword ? (
                                        <Input.Password type={showPassword ? "text" : "password"} value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
                                    ) : (
                                        <div className="flex items-center">
                                            <span>******</span>
                                            <Button type="link" icon={<FormOutlined style={{color: colorPrimary}}/>} onClick={() => setEditPassword(true)} />
                                        </div>
                                    )
                                }
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <Button type="dashed" onClick={() => reset()} loading={loading}>Đặt lại</Button>
                                <Button type="primary" onClick={() => submit()} loading={loading}>Cập nhật</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProductPage;
