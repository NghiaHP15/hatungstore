/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import React, { useEffect, useRef, useState } from "react";
import { Invoice } from "../types";
import { Button, DatePicker, Flex, Input, Select, Space, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, LeftOutlined, PlusOutlined, PrinterOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons";
import { invoicesAPI } from "@/lib/api";
import PageSizeOption from "@/components/PageSizeOption";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import InvoiceDetail from "@/components/model/InvoiceModel";
import dayjs from "dayjs";

const CategoryPage = () => {
    const [loading, setLoading] = useState(false);
    const [lazyParams, setLazyParams] = useState({
        page: 0,
        size: 20,
        search: "",
        limit: 1000,
        status: null,
        start_date: "",
        end_date: "",
    });
    const [data, setData] = useState<Invoice[]>([]);
    const debouncedValue = useDebounce(lazyParams.search, 500);
    const refDetail = useRef<any>(null);
    const router = useRouter();

    const fetchInvoice = async () => {
        try{
            setLoading(true);
            const res = await invoicesAPI.getInvoices({ limit: lazyParams.limit, search: debouncedValue, status: lazyParams.status, start_date: lazyParams.start_date, end_date: lazyParams.end_date });
            
            if(res.data.invoices){
                setData(res.data.invoices)
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lazyParams.limit, lazyParams.status, lazyParams.start_date, lazyParams.end_date, debouncedValue]);


    const column: any = [
        {
            key: 'index',
            title: '#',
            render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
            width: 50,
        },
        {
            key: 'code',
            title: "Mã đơn hàng",
            dataIndex: 'code',
            width: 100,
            render: (_: any, record: Invoice) => <span className="line-clamp-2">{record.invoice_code}</span>
        },
        {
            key: 'customer_name',
            dataIndex: 'customer_name',
            title: "Khách hàng",
            width: 150,
            render: (_: any, record: Invoice) => <span className="line-clamp-2">{record.customer?.name}</span>
        },
        {
            key: 'amount',
            dataIndex: 'amount',
            title: "Số lượng",
            width: 100,
            render: (_: any, record: Invoice) => <span className="line-clamp-2">{record.items?.reduce((total, item) => total + item.quantity, 0)}</span>
        },
        {
            key: 'total_amount',
            dataIndex: 'total_amount',
            title: "Tống tiền",
            width: 100,
            render: (_: any, record: Invoice) => <span className="line-clamp-2">{formatCurrency(record.total_amount || 0)}</span>
        },
        {
            key: 'status',
            dataIndex: 'status',
            title: "Trạng thái",
            width: 100,
            render: (_: any, record: Invoice) => <span className="line-clamp-2">{record.status ? <Tag className="font-roboto" color="green">Đã giao</Tag> : <Tag className="font-roboto" color="red">Chưa giao</Tag>}</span>
        },
        {
            key: 'created_at',
            dataIndex: 'created_at',
            title: "Ngày tạo",
            width: 100,
            render: (_: any, record: Invoice) => <span className="line-clamp-2">{dayjs(record.created_at).format('DD/MM/YYYY')}</span>
        },
        {
            key: 'action',
            title: "Hành động",
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_: any, record: Invoice) => (
            <Space key={record.id}>
                <Button icon={<PrinterOutlined className="text-blue-500!"/>} className="border-blue-500!" onClick={() => onView(record)} />
                <Button icon={<EditOutlined className="text-blue-500!"/>} className="border-blue-500!" onClick={() => {
                    router.push(`/invoices/update/${record.id}`);
                }} />
                <Button icon={<DeleteOutlined className="text-red-500!"/>} className="border-red-500!" onClick={() => onDelete(record)} />
            </Space>
            ),
        },
    ]

    const reload = () => {
        fetchInvoice();
    };

    const onCreate = () => {
        router.push('/invoices/create');
    };

    const onView = (formValue: Invoice) => {
        refDetail.current.view({ ...formValue })
    };

    const onDelete = async (formValue: Invoice) => {
        if(!formValue.id) return;
        try {
        setLoading(true);
        const res = await invoicesAPI.deleteInvoice(formValue?.id);
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

    const onChangeSearch = (value: string) => {
        setLazyParams({
        ...lazyParams,
        search: value,
        });
    };

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
                <Space>
                    <Button 
                        type="primary" 
                        className="font-roboto"
                        onClick={onCreate} 
                        icon={<PlusOutlined className="text-white"/>}
                    >
                    Thêm đơn hàng
                    </Button>
                </Space>
                <Space>
                    <Input
                      placeholder="Tìm kiếm mã ..."
                      allowClear
                      suffix={<SearchOutlined className="text-gray-400!" />}
                      onChange={(e) => onChangeSearch(e.target.value)}
                    />
                    <DatePicker.RangePicker
                      placeholder={['Bắt đầu', 'Kết thúc']}
                      onChange={(dates) => {
                        if (!dates) return;
                        const [start, end] = dates;
                        const startFormatted = start?.utc().format("YYYY-MM-DD HH:mm:ss.SSSSSS[+00]");
                        const endFormatted = end?.utc().format("YYYY-MM-DD HH:mm:ss.SSSSSS[+00]");
                        setLazyParams({
                          ...lazyParams,
                          start_date: startFormatted || "",
                          end_date: endFormatted || "",
                        });
                        
                      }}
                      format="YYYY-MM-DD"
                    />
                    <DatePicker
                      placeholder="Ngày tạo"
                      onChange={(date) => {
                        if (!date) return;
                        const startFormatted = date.startOf("day").utc().format("YYYY-MM-DD HH:mm:ss[+00]");
                        const endFormatted = date.endOf("day").utc().format("YYYY-MM-DD HH:mm:ss[+00]");
                        setLazyParams({
                          ...lazyParams,
                          start_date: startFormatted || "",
                          end_date: endFormatted || "",
                        });
                      }}
                      format="YYYY-MM-DD"
                    />
                    <Select
                      placeholder="Trạng thái"
                      style={{ width: 120 }}
                      allowClear
                      onChange={(value) => {
                        setLazyParams({
                          ...lazyParams,
                          status: value,
                        });
                      }}
                    >
                      <Select.Option value={false}>Chưa giao</Select.Option>
                      <Select.Option value={true}>Đã giao</Select.Option>
                    </Select>
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
                        <Typography.Text className="text-sm font-normal">
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
                footer={() => (
                    <div className="flex justify-between font-roboto">
                        <span className="font-medium">Tổng tiền</span>
                        <span className="font-medium text-base">{formatCurrency(data.reduce((total, item) => total + (item.total_amount || 0), 0))}</span>
                    </div>
                )}
                columns={column}
                dataSource={data}
                />
            </Flex>
            <InvoiceDetail ref={refDetail} reload={reload} />
        </DashboardLayout>
    );
};

export default CategoryPage;
