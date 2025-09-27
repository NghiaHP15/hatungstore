/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { formatCurrency } from '@/lib/utils';
import { invoicesAPI, reportAPI } from '@/lib/api';
import { Invoice } from '../types';

interface DashboardStats {
  totalSales: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockCount: 0,
  });

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
          totalSales: res.data.totalRevenue,
          totalProducts: res.data.totalProducts,
          totalCustomers: res.data.totalCustomers,
          lowStockCount: res.data.totalOrders,
        });
      }
    } catch (error) {
      console.error(error);
    }
    // This would normally fetch from your API
  };

  const salesColumns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_code',
      key: 'invoice_code',
      width: 150,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
      render: (_: string, record: Invoice) => record.customer?.name,
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
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Doanh thu"
                value={stats.totalSales}
                formatter={(value) => formatCurrency(value as number)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Sản phẩm"
                value={stats.totalProducts}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Khách hàng"
                value={stats.totalCustomers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đơn hàng"
                value={stats.lowStockCount}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#cf1322' }}
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
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  );
}
