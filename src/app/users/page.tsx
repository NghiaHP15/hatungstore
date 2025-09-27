/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import React, { useEffect, useRef, useState } from "react";
import { User } from "../types";
import { Button, Flex, Input, Space, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined, LeftOutlined, PlusOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons";
import { usersAPI } from "@/lib/api";
import PageSizeOption from "@/components/PageSizeOption";
import { useDebounce } from "@/hooks/useDebounce";
import UserDetail from "@/components/model/UserModel";

const ProductPage = () => {
    const [loading, setLoading] = useState(false);
    const [lazyParams, setLazyParams] = useState({
        page: 0,
        size: 20,
        search: "",
        limit: 1000,
    });
    const [data, setData] = useState<User[]>([]);
    const debouncedValue = useDebounce(lazyParams.search, 500);
    const refDetail = useRef<any>(null);

    const fetchProducts = async () => {
        try{
            setLoading(true);
            const res = await usersAPI.getUsers({ limit: lazyParams.limit, search: debouncedValue });
            
            if(res.data.profiles){
                setData(res.data.profiles)
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lazyParams.limit,  debouncedValue]);

    const column: any = [
        {
            key: 'index',
            title: '#',
            render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
            width: 50,
        },
        {
            key: 'full_name',
            title: "Tên người dùng",
            dataIndex: 'full_name',
            width: 150,
            render: (_: any, record: User) => <span className="line-clamp-2">{record?.full_name}</span>
        },
        {
            key: 'email',
            title: "Email",
            dataIndex: 'email',
            width: 200,
            render: (_: any, record: User) => <span className="line-clamp-2">{record?.email}</span>
        },
        {
            key: 'role',
            title: "Vai trò",
            dataIndex: 'role',
            width: 50,
            render: (_: any, record: User) => <span className="line-clamp-2">{record?.role}</span>
        },
        {
            key: 'action',
            title: "Hành động",
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_: any, record: User) => (
            <Space key={record.id}>
                <Button icon={<EditOutlined className="text-blue-500!"/>} className="border-blue-500!" onClick={() => onEdit(record)} />
                <Button icon={<DeleteOutlined className="text-red-500!"/>} className="border-red-500!" onClick={() => onDelete(record?.id)} />
            </Space>
            ),
        },
    ]

    const reload = () => {
        fetchProducts();
    };

    const onCreate = () => {
      refDetail.current.create();
    };

    const onEdit = (formValue: User) => {
        refDetail.current.update({ ...formValue })
    };

    const onDelete = async (id: string) => {
        if(!id) return;
        try {
        setLoading(true);
        const res = await usersAPI.deleteUser(id);
        if(res) reload();
        } catch (error) {
        console.error(error);
        } finally {
        setLoading(false);
        }
    }

    const changePageSize = (pageSize: number) => {
        setLazyParams({
        ...lazyParams,
        size: pageSize,
        });
    };


    const onChangeSearch = (value: string, key: string) => {
        setLazyParams({
        ...lazyParams,
        [key]: value,
        });
    };
    console.log(lazyParams);
    

    const onPage = (page: number, pageSize: number) => {
        setLazyParams({
        ...lazyParams,
        page: page - 1,
        size: pageSize,
        });
    };
    return (
        <DashboardLayout>
            <Flex vertical className="h-full">
                <Flex justify="space-between" className="mb-3! p-3! rounded-md bg-gray-50">
                <Space >
                    <Button 
                    type="primary" 
                    className="font-roboto"
                    onClick={onCreate} 
                    icon={<PlusOutlined className="text-white"/>}
                    >
                    Thêm người dùng
                    </Button>
                </Space>
                <Space>
                    <Input placeholder="Tìm kiếm ..." suffix={<SearchOutlined className="text-gray-400!" />} onChange={(e) => onChangeSearch(e.target.value, 'search')} />
                </Space>
                </Flex>
                <Table
                    rowKey="id"
                    size="small"
                    className="relative"
                    scroll={{ x: 'w-full', y: 'calc(100vh - 350px)' }}
                    loading={loading}
                    pagination={{
                        responsive: true,
                        total: data.length,
                        itemRender(page, type, originalElement) {
                        if (type === "prev") {
                            return <Button size='small' className='mr-1 ml-2 !rounded-sm'  icon={<LeftOutlined style={{ fontSize: '12px' }} />}></Button>;
                        }
                        if (type === "next") {
                            return <Button size='small' className='ml-1 mr-2 !rounded-sm'  icon={<RightOutlined style={{ fontSize: '12px' }} />}></Button>;
                        }
                        if (type === "page") {
                            return <a>{page}</a>;
                        }
                        return originalElement;
                        },
                        pageSize: lazyParams.size,
                        size: 'small',
                        current: lazyParams.page + 1,
                        showTotal: (total) => (
                        <div className="absolute left-2">
                            <Space>
                            <Typography.Text className="text-sm font-normal font-roboto">
                                Hiển thị
                                {total > 0
                                ? `${lazyParams.page * lazyParams.size + 1} - ${Math.min(
                                    (lazyParams.page + 1) * lazyParams.size,
                                    total,
                                    )} (${total})`
                                : '0 / 0'}
                            </Typography.Text>
                            <PageSizeOption pageSize={lazyParams.size} onChange={changePageSize} />
                            </Space>
                        </div>
                        ),
                        onChange: onPage,
                    }}
                    columns={column}
                    dataSource={data}
                />
            </Flex>
            <UserDetail
                ref={refDetail} 
                reload={reload}
            />
        </DashboardLayout>
    );
};

export default ProductPage;
