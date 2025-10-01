/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button } from 'antd';
import {
  ShoppingCartOutlined,
  TruckOutlined,
  SnippetsOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { formatCurrency } from '@/lib/utils';
import { invoicesAPI, reportAPI } from '@/lib/api';
import { Invoice } from '../types';
import InvoiceDetail from '@/components/model/InvoiceModel';

interface DashboardStats {
  invoiceDelivered: number;
  invoicePending: number;
  totalInvoices: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    invoiceDelivered: 0,
    invoicePending: 0,
    totalInvoices: 0,
  });
  const refDetail = useRef<any>(null);

  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardReport();
    fetchDashboardInvoices();
  }, []);

  const fetchDashboardInvoices = async () => {
    try {
      const res = await invoicesAPI.getInvoices({ limit: 10, status: false });
      if (res.data.invoices) {
        setRecentSales(res.data.invoices);
      }  
    } catch (error) {
      console.error(error);
    }
  }

  const fetchDashboardReport = async () => {
    try{ 
      const res = await reportAPI.getGeneral();
      if(res.data){
        setStats({
          invoiceDelivered: res.data.invoiceDelivered,
          invoicePending: res.data.invoicePending,
          totalInvoices: res.data.totalInvoices
        });
      }
    } catch (error) {
      console.error(error);
    }
    // This would normally fetch from your API
  };

  const onView = (formValue: Invoice) => {
    refDetail.current.view({ ...formValue })
  };

  const reload = () => {
    fetchDashboardInvoices();
  };

  const salesColumns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_code',
      key: 'invoice_code',
      width: 100,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150,
      render: (_: string, record: Invoice) => record.customer?.name,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      render: (_: string, record: Invoice) => record.customer?.address,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: boolean) => (
        <Tag color={status ? 'green' : 'orange'}>
          {status ? 'Đã giao' : 'Chưa giao'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'action',
      title: "",
      align: "center" as const, 
      width: 100,
      render: (_: any, record: Invoice) => (
      <Space key={record.id}>
        <Button icon={<PrinterOutlined className="text-blue-500!"/>} className="border-blue-500!" onClick={() => onView(record)} />
      </Space>
      ),
    },  
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <Row gutter={16}>
          <Col xs={24} lg={8}>
            <Card>
              <Statistic
                title={<span className='text-lg text-gray-700!'>Đơn đã giao</span>}
                value={stats.invoiceDelivered}
                formatter={(value) => formatCurrency(value as number)}
                prefix={<TruckOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card>
              <Statistic
                title={<span className='text-lg text-gray-700!'>Đơn chưa giao</span>}
                value={stats.invoicePending}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card>
              <Statistic
                title={<span className='text-lg text-gray-700!'>Tổng đơn hàng</span>}
                value={stats.totalInvoices}
                prefix={<SnippetsOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tables */}
        <Row gutter={16}>
          <Col sm={24} >
            <Card >
              <h2 className='text-base font-roboto mb-2 border-l-3 border-red-400 pl-2'>Đơn hàng chưa chuyển</h2>
              <Table
                key="id"
                columns={salesColumns}
                dataSource={recentSales}
                pagination={{ pageSize: 10 }}
                size="small"
              />
              <InvoiceDetail ref={refDetail} reload={reload} />
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  );
}
