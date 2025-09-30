'use client';

import React, { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  theme,
  MenuProps,
  ConfigProvider,
  Input,
  Popover,
  List,
  Image,
  Button,
} from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  DatabaseOutlined,
  SearchOutlined,
  TruckOutlined,
  TeamOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { avatar, no_image } from '@/images';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductUnit } from '@/app/types';
import { productunitsAPI } from '@/lib/api';
import { formatCurrency, toLowerCaseNonAccent } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';

const { Header, Sider, Content, Footer } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [show, setShow] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const deboundedSearch = useDebounce(search, 500);
  const [products, setProducts] = useState<ProductUnit[]>([]);
  const [loadSearch, setLoadSearch] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const user = useUserStore((state) => state.user);

  const {
    token: { colorBgContainer, colorPrimary },
  } = theme.useToken();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadSearch(true);
        const res = await productunitsAPI.getProductUnits({ limit: 15, search: deboundedSearch });
        if (res.data.product_units) {
          setProducts(res.data.product_units);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadSearch(false);
      }
    }

    fetchProducts();
  }, [deboundedSearch])

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined className='text-lg!' />,
      label: <Link href="/dashboard" className='text-base font-roboto'>Trang chủ</Link>,
    },
    {
      key: '/products',
      icon: <ShoppingOutlined className='text-lg!' />,
      label: "Sản phẩm",
      children: [
        {
          key: '/products/units',
          label: <Link href="/products/units" className='text-base font-roboto'>Tất cả mặt hàng</Link>,
        },
        {
          key: '/products/list',
          label: <Link href="/products/list" className='text-base font-roboto'>Sản phẩm</Link>,
        },
      ]
    },
    {
      key: '/categories',
      icon: <DatabaseOutlined className='text-lg!' />,
      label: <Link href="/categories" className='text-base font-roboto'>Danh mục</Link>,
    },
    {
      key: '/invoices',
      icon: <FileTextOutlined className='text-lg!' />,
      label: <Link href="/invoices" className='text-base font-roboto'>Hóa đơn</Link>,
    },
    {
      key: '/transports',
      icon: <TruckOutlined className='text-lg!' />,
      label: <Link href="/transports" className='text-base font-roboto'>Sổ tổng hợp</Link>,
    },
    {
      key: '/customers',
      icon: <TeamOutlined className='text-lg!' />,
      label: <Link href="/customers" className='text-base font-roboto'>Khách hàng</Link>,
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: '/users',
            icon: <UsergroupAddOutlined className='text-lg!' />,
            label: <Link href="/users" className='text-base font-roboto'>Người dùng</Link>,
          },
        ]
      : []),
    ...(user?.role === 'admin' || user?.role === 'manager'
      ? [
          {
            key: '/settings',
            icon: <SettingOutlined className='text-lg!' />,
            label: <Link href="/settings" className='text-base font-roboto'>Cài đặt</Link>,
          },
        ]   
      : []),
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Trang cá nhân',
      onClick: () => router.push('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: signOut,
    },
  ];

  useEffect(() => {
    const rootKey = `/${pathname.split("/")[1]}`; // lấy segment đầu
    setOpenKeys([rootKey]);
  }, [pathname]);

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys);
  };
  const onClick: MenuProps['onClick'] = ({ key }) => {
    router.push(key);
  };

  const renderSearch = () => {
    return (
      <div className='w-[500px] h-max overflow-auto'>
        <List
        loading={loadSearch}
          itemLayout="horizontal"
          dataSource={products}
          renderItem={(item) => (
            <List.Item className='py-2!'>
              <div className='w-full px-4 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Image
                    src={item.product?.image_url || no_image.src}
                    alt={item.name}
                    width={50}
                    height={50}
                    preview={false}
                  />
                  <div className='flex flex-col'>
                    <span className='text-lg font-roboto'>{item.name}</span>
                    <span className='text-sm font-roboto text-gray-400'>{item.unit_name}</span>
                  </div>
                </div>
                <div>
                  <span className='text-lg font-roboto font-medium text-red-400'>{formatCurrency(item.price)}</span>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
    )
  }


  return (
    <>
    <Layout className="h-screen">
      <Sider collapsible collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} >
        <div className="h-16 flex items-center justify-center">
          <h2 className="text-white font-bold text-xl font-roboto">
            {collapsed ? 'GS' : 'Grocery Store'}
          </h2>
        </div>
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                itemColor: collapsed ? "#fff" : "#fff",
                itemHoverBg: "#ff4d4f5e",
                itemHoverColor: "#fff",
                // subMenuItemSelectedColor: "#fff",
                itemActiveBg: colorPrimary,
                subMenuItemBorderRadius: 8,
                itemPaddingInline: 23,
                itemHeight: 44,
                itemSelectedColor: "#fff",
                itemSelectedBg: colorPrimary,
                itemBg: "#121212",
                subMenuItemBg: "#121212",
                popupBg: "#121212",
              }
            }
          }}
        >
          <Menu
            theme="light"
            mode="inline"
            className='!mt-4 !border-none'
            defaultOpenKeys={openKeys}
            defaultSelectedKeys={[pathname]}
            selectedKeys={[pathname]}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            onClick={onClick}
            // style={menuStyle}
            inlineCollapsed={collapsed}
            items={menuItems}
          />
        </ConfigProvider>
      </Sider>
      <Layout>
        <Header
          style={{ background: colorBgContainer }}
          className="flex items-center justify-end gap-4 px-6! h-[55px]!"
        >
          <Popover 
            trigger={"click"}
            open={show}
            onOpenChange={(open) => setShow(open)}
            placement="bottom"
            arrow={false}
            content={renderSearch}
          >
          <Input 
            placeholder='Tìm kiếm sản phẩm ...' 
            className='flex-1!' 
            onChange={(e) => {
              setShow(true);
              setSearch(toLowerCaseNonAccent(e.target.value));
            }}
            suffix={<SearchOutlined className='text-lg text-gray-400!' />}
            allowClear
            size='large'
          />
          </Popover>
          <Button color="primary" variant="outlined" icon={<PlusOutlined />} size='large' onClick={() => router.push('/invoices/create')}>Thêm đơn hàng</Button>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className='flex items-center gap-2 cursor-pointer leading-none'>
              <Avatar shape='square' src={avatar.src} className='w-10! h-10!' />
              <div className='flex flex-col'>
                <span className="capitalize font-roboto font-medium text-gray-900">{user?.full_name || user?.email}</span>
                <span className="capitalize font-roboto text-gray-600">{user?.role}</span>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content className="m-6 p-6 bg-white rounded-lg min-h-96">
          {children}
        </Content>
        <Footer style={{ textAlign: 'center' }} className="bg-white! py-3!">
          <span className='font-roboto'>Thiết kế bởi IndecoVietNam ©{new Date().getFullYear()}</span>
        </Footer>
      </Layout>
    </Layout>
    </>
  );
}
