/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import React, { useEffect, useState } from "react";
import { Button, DatePicker, Flex, Space, Table, Typography } from "antd";
import { DownloadOutlined, FilePdfOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { reportAPI } from "@/lib/api";
import PageSizeOption from "@/components/PageSizeOption";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils";
import { ReportProduct } from "@/app/types";
import { exportProductDailyExcel } from "@/utils/exportProductExcel";
import { exportProductDailyPDF } from "@/utils/exportProductPDF";
import dayjs from "dayjs";

const ReportPage = () => {
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
    const [data, setData] = useState<ReportProduct[]>([]);
    const debouncedValue = useDebounce(lazyParams.search, 500);

    const fetchReport = async () => {
        try{
            setLoading(true);
            const res = await reportAPI.getProduct({ limit: lazyParams.limit, search: debouncedValue, status: lazyParams.status, start_date: lazyParams.start_date, end_date: lazyParams.end_date });
            
            if(res.data.data){
                setData(res.data.data)
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lazyParams.limit, lazyParams.status, lazyParams.start_date, lazyParams.end_date, debouncedValue]);


    const column: any = [
        {
            key: 'index',
            title: '#',
            render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
            width: 40,
        },
        {
            key: 'product_name',
            title: "Tên sản phẩm",
            dataIndex: 'product_name',
            render: (_: any, record: ReportProduct) => <span className="line-clamp-2">{record.product_name}</span>
        },
        {
            key: 'total_quantity_sold',
            dataIndex: 'total_quantity_sold',
            title: "Số lượng bán",
            render: (_: any, record: ReportProduct) => <span className="line-clamp-2">{record.total_quantity_sold}</span>
        },
        {
            key: 'total_orders',
            dataIndex: 'total_orders',
            title: "Số đơn hàng",
            render: (_: any, record: ReportProduct) => <span className="line-clamp-2">{record.total_orders}</span>
        },
        {
            key: 'total_customers',
            dataIndex: 'total_customers',
            title: "Số khách hàng",
            render: (_: any, record: ReportProduct) => <span className="line-clamp-2">{record.total_customers}</span>
        },
        {
            key: 'total_revenue',
            dataIndex: 'total_revenue',
            title: "Doanh thu",
            render: (_: any, record: ReportProduct) => <span className="line-clamp-2">{formatCurrency(record.total_revenue)}</span>
        },
    ]

    const changePageSize = (pageSize: number) => {
        setLazyParams({
        ...lazyParams,
        size: pageSize,
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
                        icon={<DownloadOutlined />} color="green" variant="solid"
                        onClick={() => {
                            exportProductDailyExcel(
                                data,
                                lazyParams.start_date ? dayjs(lazyParams.start_date).format("YYYY-MM-DD") : "",
                                lazyParams.end_date ? dayjs(lazyParams.end_date).format("YYYY-MM-DD") : "",
                            )
                        }}
                    >
                        Excel
                    </Button>
                    <Button 
                        icon={<FilePdfOutlined />} color="danger" variant="solid"
                        onClick={() => {
                            exportProductDailyPDF(
                                data,
                                lazyParams.start_date ? dayjs(lazyParams.start_date).format("YYYY-MM-DD") : "",
                                lazyParams.end_date ? dayjs(lazyParams.end_date).format("YYYY-MM-DD") : "",
                            )
                        }}
                    >
                        PDF
                    </Button>
                </Space>
                <Space>
                    <DatePicker.RangePicker
                      placeholder={['Bắt đầu', 'Kết thúc']}
                      onChange={(dates) => {
                        if (!dates) return;
                        const [start, end] = dates;
                        const startFormatted = start?.format("YYYY-MM-DD HH:mm:ss.SSSSSS[+00]");
                        const endFormatted = end?.format("YYYY-MM-DD HH:mm:ss.SSSSSS[+00]");
                        setLazyParams({
                          ...lazyParams,
                          start_date: startFormatted || "",
                          end_date: endFormatted || "",
                        });
                        
                      }}
                      format="YYYY-MM-DD"
                    />
                    <DatePicker
                      placeholder="Ngày"
                      onChange={(date) => {
                        if (!date) return;
                        const startFormatted = date.startOf("day").format("YYYY-MM-DD ");
                        const endFormatted = date.endOf("day").format("YYYY-MM-DD");
                        setLazyParams({
                          ...lazyParams,
                          start_date: startFormatted || "",
                          end_date: endFormatted || "",
                        });
                      }}
                      format="YYYY-MM-DD"
                    />
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
                        <span className="font-medium text-base">{formatCurrency(data.reduce((total, item) => total + (item.total_revenue || 0), 0))}</span>
                    </div>
                )}
                columns={column}
                dataSource={data}
                />
            </Flex>
        </DashboardLayout>
    );
};

export default ReportPage;
