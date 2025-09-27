/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import React, { useEffect, useRef, useState } from "react";
import { InvoiceItem, Shipping, ShippingItem } from "../types";
import { Button, DatePicker, Flex, Input, Select, Space, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EyeOutlined, LeftOutlined, PlusOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons";
import { shippingAPI } from "@/lib/api";
import PageSizeOption from "@/components/PageSizeOption";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils";
import ShippingDetail from "@/components/model/ShippingModel";
import dayjs from "dayjs";

const TransportPage = () => {
    const [loading, setLoading] = useState(false);
    const [lazyParams, setLazyParams] = useState({
        page: 0,
        size: 20,
        search: "",
        limit: 1000,
        status: true,
        start_date: "",
        end_date: ""
    });
    const [data, setData] = useState<Shipping[]>([]);
    const debouncedValue = useDebounce(lazyParams.search, 500);
    const refDetail = useRef<any>(null);

    const fetchShipping = async () => {
        try{
            setLoading(true);
            const res = await shippingAPI.getShippings({ limit: lazyParams.limit, search: debouncedValue, status: lazyParams.status, start_date: lazyParams.start_date, end_date: lazyParams.end_date });
            
            if(res.data.shippings){
                setData(res.data.shippings)
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchShipping();
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
            title: "Mã vận chuyển",
            dataIndex: 'code',
            width: 150,
            render: (_: any, record: Shipping) => <span className="line-clamp-2">{record.shipping_code}</span>
        },
        {
            key: 'sum_order',
            dataIndex: 'sum_order',
            title: "SL đơn hàng",
            width: 100,
            render: (_: any, record: Shipping) => {
                return <span className="line-clamp-2">{record.items?.length}</span>
            }
        },
        {
            key: 'amount',
            dataIndex: 'amount',
            title: "Tổng SP",
            width: 100,
            render: (_: any, record: Shipping) => {
                const totalQuantity = record.items?.reduce((shippingTotal, shippingItem: ShippingItem) => {
                    const invoiceItems = shippingItem.invoice?.items ?? [];
                    const invoiceTotal = invoiceItems.reduce((invoiceTotal, invoiceItem: InvoiceItem) => {
                        return invoiceTotal + invoiceItem.quantity;
                    }, 0);
                    return shippingTotal + invoiceTotal;
                }, 0);
                return <span className="line-clamp-2">{totalQuantity}</span>
            }
        },
        {
            key: 'total_amount',
            dataIndex: 'total_amount',
            title: "Tống tiền",
            width: 100,
            render: (_: any, record: Shipping) => {
                const totalPrice = record.items?.reduce((shippingTotal, shippingItem: ShippingItem) => {
                    const invoiceItems = shippingItem.invoice?.items ?? [];
                    const invoiceTotal = invoiceItems.reduce((invoiceTotal, invoiceItem: InvoiceItem) => {
                        return invoiceTotal + invoiceItem.total_price;
                    }, 0);
                    return shippingTotal + invoiceTotal;
                }, 0);
                return <span className="line-clamp-2">{formatCurrency(totalPrice || 0)}</span>
            }
        },
        {
            key: 'status',
            dataIndex: 'status',
            title: "Trạng thái",
            width: 100,
            render: (_: any, record: Shipping) => <span className="line-clamp-2">{record.status ? <Tag className="font-roboto" color="green">Đã giao</Tag> : <Tag className="font-roboto" color="red">Chưa giao</Tag>}</span>
        },
        {
            key: 'created_at',
            dataIndex: 'created_at',
            title: "Ngày tạo",
            width: 100,
            render: (_: any, record: Shipping) => {
                return <span>{dayjs(record.created_at).format('DD/MM/YYYY')}</span>
            }
        },
        {
            key: 'action',
            title: "Hành động",
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_: any, record: Shipping) => (
            <Space key={record.id}>
                <Button icon={<EyeOutlined className="text-blue-500!"/>} className="border-blue-500!" onClick={() => onEdit(record)} />
                <Button icon={<DeleteOutlined className="text-red-500!"/>} className="border-red-500!" onClick={() => onDelete(record)} />
            </Space>
            ),
        },
    ]

    const reload = () => {
        fetchShipping();
    };

    const onCreate = () => {
        refDetail.current.create();
    };

     const onEdit = (formValue: Shipping) => {
        refDetail.current.update(formValue);
    };

    const onDelete = async (formValue: Shipping) => {
        if(!formValue.id) return;
        try {
        setLoading(true);
        const res = await shippingAPI.deleteShipping(formValue?.id);
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
                columns={column}
                dataSource={data}
                />
            </Flex>
            <ShippingDetail ref={refDetail} reload={reload} />
        </DashboardLayout>
    );
};

export default TransportPage;
