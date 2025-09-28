/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Category, Customer, Invoice, InvoiceItem, Product, ProductUnit } from "@/app/types";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useDebounce } from "@/hooks/useDebounce";
import { no_image } from "@/images";
import { categoriesAPI, customersAPI, invoicesAPI, productsAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Col, Image, Input, InputNumber, List, message, Popover, Row, Select, Space, Table, Typography } from "antd";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

const emptyParameter: Invoice = {
    id: uuid(),
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    discount_amount: 0,
    status: false,
    items: [],
}

const CreateInvoice = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [invoice, setInvoice] = useState<Invoice>(emptyParameter);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [searchProduct, setSearchProduct] = useState("");
    const [lazyParams, setLazyParams] = useState({ size: 20, page: 0, limit: 1000, search: "", category: "" });
    const deboundedProduct = useDebounce(searchProduct, 500);
    const [listOrder, setListOrder] = useState<InvoiceItem[]>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const debouncedCustomerName = useDebounce(invoice.customer_name || "", 500);
    const [showCustomer, setShowCustomer] = useState<boolean>(false);

    const fetchProducts = async () => {
        try {
            setLoadingProduct(true);
            const res = await productsAPI.getProducts({ limit: lazyParams.limit, search: deboundedProduct, category: lazyParams.category });
            if (res.data.products) {
                setProducts(res.data.products);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingProduct(false);
        }
    }

    const fetchCategorys = async () => {
        try {
            const res = await categoriesAPI.getCategories({ limit: 100 });
            if (res.data.categories) {
                setCategories(res.data.categories);
            }
        } catch (error) {
            console.error(error);
        } 
    }

    const fetCustomer = async () => {
        try {
            const res = await customersAPI.getCustomers({ search: debouncedCustomerName });
            if (res.data.customers) {
                setCustomers(res.data.customers);
            }
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedCustomerName]);

    useEffect(() => {
        fetchCategorys();
    }, []);

    useEffect(() => {
        fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lazyParams.limit, lazyParams.category, deboundedProduct]);

    const handleAddProduct = (unit: ProductUnit, product: Product) => {
        if (!unit || !product) return;
        unit.image_url = product.image_url;
        const checkProduct = listOrder.find((item) => item.product_unit_id === unit.id);
        if (checkProduct) {
            setListOrder(
                listOrder.map((item) => (item.product_unit_id === unit.id ? 
                    { ...item, quantity: item.quantity + 1 } 
                    : item
                ))
            );
        } else {
            setListOrder([
                ...listOrder, 
                { 
                    id: uuid(),
                    product_unit_id: unit.id, 
                    quantity: 1, 
                    unit_price: unit.price, 
                    total_price: unit.price,
                    product_unit: unit
                }
            ]);
        }
    };
    
    const handleRemoveProduct = (invoice_item: InvoiceItem) => {
        setListOrder(listOrder.filter((item) => item.id !== invoice_item.id));
    };

    const onChangeQuantity = (invoice_item: InvoiceItem, quantity: number | null) => {
        setListOrder(
            listOrder.map((item) => 
                (item.id === invoice_item.id ? 
                    { 
                        ...item,
                        total_price: item.unit_price * (quantity || 0), 
                        quantity: quantity || 0 
                    } : 
                    item
                )
            )
        );
    };

    const onChangeUnitPrice = (invoice_item: InvoiceItem, unit_price: number | null) => {
        setListOrder(
            listOrder.map((item) => 
                (item.id === invoice_item.id ? 
                    { 
                        ...item,
                        unit_price: unit_price || 0 ,
                        total_price: (unit_price || 0) * item.quantity, 
                    } : 
                    item
                )
            )
        );
    };

    const onPage = (page: number, pageSize: number) => {
        setLazyParams({
        ...lazyParams,
        page: page - 1,
        size: pageSize,
        });
    };

    const handleCreateInvoice = async () => {
        const _params = _.cloneDeep(invoice);
        _params.items = listOrder;
        if (_params.customer_name === "") {
            messageApi.open({
                type: 'error',
                content: 'Vui lòng thêm tên khách hàng',
            });
            return;
        }
        
        if (_params.items.length === 0) {
            messageApi.open({
                type: 'error',
                content: 'Vui lòng thêm sản phẩm vào hóa đơn',
            });
            return;
        }
        try {
            setLoading(true);
            const res = await invoicesAPI.createInvoice(_params);
            if (res.data) {
                messageApi.open({
                    type: 'success',
                    content: 'Tạo hóa đơn thành công',
                });
                setInvoice(emptyParameter);
                setListOrder([]);
            }
        } catch (error) {
            messageApi.open({
                type: 'error',
                content: 'Tạo hóa đơn không thành công',
            });
            console.log(error);
            
        } finally {
            setLoading(false);
        }
    }

    const column: any = [
        {
            key: 'image',
            dataIndex: 'image',
            title: false,
            width: 50,
            render: (_: any, record: Product) => (
            <div className="flex items-center rounded-md w-max h-max overflow-hidden">
                <Image
                    width={50}
                    height={50}
                    src={record.image_url || no_image.src}
                    alt={record.name}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback={no_image.src}
                    preview={false}
                    />
            </div>
            )
        },
        {
            key: 'name',
            dataIndex: 'name',
            title: false,
            width: 150,
            render: (_: any, record: Product) => <span className="line-clamp-2 font-roboto text-base">{record.name}</span>
        }
    ]

    return (
        <DashboardLayout>
            <div className="grid grid-cols-9 gap-6 h-full">
                <div className="col-span-3 h-full">
                    <div className="flex flex-col gap-2 border border-gray-200 rounded-md h-full">
                        <div className="flex flex-col gap-2 p-4">
                            <span className="text-base font-roboto">Danh sách sản phẩm</span>
                            <div className="flex items-center gap-2">
                                <span className="w-25 text-base font-roboto">Sản phẩm: </span>
                                <Input size="large" placeholder="Nhập tìm kiếm..." value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-25 text-base font-roboto">Danh mục: </span>
                                <Select
                                    size="large"
                                    className="font-roboto"
                                    style={{ width: '100%' }}
                                    placeholder="Chọn danh mục"
                                    fieldNames={{ label: 'name', value: 'id' }}
                                    options={categories || []}
                                    onChange={(value) => setLazyParams({ ...lazyParams, category: value })}
                                />
                            </div>
                        </div>
                        <Table
                            rowKey="id"
                            size="small"
                            className="relative none-header"
                            scroll={{ y: 'calc(100vh - 420px)' }}
                            loading={loadingProduct}
                            pagination={{
                                responsive: true,
                                total: products.length,
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
                                    </Space>
                                </div>
                                ),
                                onChange: onPage,
                            }}
                            expandable={{
                                expandedRowClassName: 'bg-white cursor-pointer',
                                expandRowByClick: true,
                                showExpandColumn: false,
                                rowExpandable: () => true,
                                expandedRowRender: (record) => (
                                    <List
                                        itemLayout="horizontal"
                                        key={record.id}
                                        rowKey={"id"}
                                        dataSource={record.units}
                                        renderItem={(item) => (
                                        <List.Item className="hover:bg-gray-100" onClick={() => handleAddProduct(item, record)}>
                                            <div className="px-2 flex justify-between items-center w-full">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-roboto">{item.name}</span>
                                                        x
                                                    <span className="text-sm font-roboto">{item.unit_name}</span>
                                                </div>
                                                <span className="text-base font-roboto">{formatCurrency(item.price)}</span>
                                            </div>
                                        </List.Item>
                                        )}
                                    />
                                ),
                            }}
                            rowClassName={() => 'cursor-pointer'}
                            columns={column}
                            dataSource={products}
                        />
                    </div>
                </div>
                <div className="col-span-3">
                    <div className="flex flex-col gap-2 border border-gray-200 rounded-md h-full">
                        <div className="flex flex-col gap-2 p-4">
                            <span className="text-base font-roboto">Sản phẩm đã mua</span>
                        </div>
                        <div
                            id="scrollableDiv"
                            style={{
                                height: 'calc(100vh - 280px)',
                                overflow: 'auto',
                                padding: '0 10px',
                            }}
                        >
                             <List
                                rowKey={"id"}
                                itemLayout="horizontal"
                                dataSource={listOrder}
                                renderItem={(item) => (
                                    <List.Item 
                                        key={item.id}
                                        className='group w-full! pt-4! pb-4! px-2! rounded-sm hover:bg-gray-100 cursor-pointer transition-all duration-100'
                                    >
                                        <div className="flex items-center gap-3 w-full">
                                            <Image src={item.product_unit?.image_url || no_image.src} preview={false} alt="" width={55} height={55} className="rounded-md shadow p-1" />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="font-roboto text-base line-clamp-1">{item.product_unit?.name}</span>
                                                    <span className="font-roboto text-base text-red-500 line-clamp-1">{formatCurrency(item.total_price)}</span>
                                                </div>
                                                <div className="flex justify-end gap-2 w-full">
                                                    <InputNumber
                                                        size="large"
                                                        min={0}
                                                        value={item.quantity}
                                                        className="w-[100px]! font-roboto"
                                                        suffix={item.product_unit?.unit_name}
                                                        onChange={(e) => onChangeQuantity(item, e)}
                                                    />
                                                    <InputNumber
                                                        size="large"
                                                        min={0}
                                                        step={1000}
                                                        suffix="đ"
                                                        value={item.unit_price} 
                                                        className="w-[120px]! font-roboto" 
                                                        onChange={(e) => onChangeUnitPrice(item, e)}
                                                    />
                                                </div>
                                            </div>
                                            <Button 
                                                type="link" 
                                                size="large"
                                                icon={<CloseOutlined />}
                                                onClick={() => handleRemoveProduct(item)}
                                                className="group-hover:w-[35px]! w-[0px]! overflow-hidden" 
                                            />
                                        </div>
                                    </List.Item>
                                )}
                                />
                        </div>
                    </div>
                </div>
                <div className="col-span-3">
                    <div className="flex flex-col gap-2 border border-gray-200 rounded-md h-full">
                        <div className="flex flex-col gap-2 p-4 ">
                            <span className="text-base font-roboto">Thông tin hóa đơn</span>
                        </div>
                        <div className="p-4">
                            <Row className="gap-2">
                                <Col span={24} className="flex! flex-col gap-1">
                                    <span className="font-roboto">Tên khách hàng:</span>
                                    <Popover 
                                        trigger="click"
                                        placement="bottom"
                                        open={showCustomer}
                                        onOpenChange={(visible) => setShowCustomer(visible)}
                                        arrow={false}
                                        content={
                                            <div className="flex flex-col gap-2 w-[200px] max-h-[400px] overflow-auto">
                                                {customers.map((item) => (
                                                    <span 
                                                        key={item.id} 
                                                        onClick={() => {
                                                            setInvoice({...invoice, customer_name: item.name})
                                                            setShowCustomer(false)
                                                        }} 
                                                        className="cursor-pointer px-2 py-1 rounded-sm hover:bg-gray-100 font-roboto"
                                                    >{item.name}</span>
                                                ))}
                                            </div>
                                        }
                                    >
                                        <Input 
                                            size="large"
                                            placeholder="Nhập tên khách hàng"
                                            value={invoice?.customer_name}
                                            onChange={(e) => setInvoice({...invoice, customer_name: e.target.value})}
                                            
                                        />
                                    </Popover>
                                </Col>
                                <Col span={24} className="flex! flex-col gap-1">
                                    <span className="font-roboto">Số điện thoại:</span>
                                    <Input
                                        size="large"
                                        placeholder="Nhập số điện thoại"
                                        value={invoice?.customer_phone}
                                        onChange={(e) => setInvoice({...invoice, customer_phone: e.target.value})}
                                    />
                                </Col>
                                <Col span={24} className="flex! flex-col gap-1">
                                    <span className="font-roboto">Địa chỉ:</span>
                                    <Input 
                                        size="large"
                                        placeholder="Nhập địa chỉ" 
                                        value={invoice?.customer_address}
                                        onChange={(e) => setInvoice({...invoice, customer_address: e.target.value})}
                                    />
                                </Col>
                                <Col span={24} className="flex! items-center justify-between mt-4 ">
                                    <span className="font-roboto">Giảm giá: </span>
                                    <InputNumber
                                        size="large"
                                        min={0}
                                        step={1000}
                                        value={invoice?.discount_amount}
                                        suffix="đ"
                                        onChange={(e) => setInvoice({...invoice, discount_amount: e || 0})}
                                    />
                                </Col>
                            </Row>
                        </div>
                        <div className="px-4 py-2 font-roboto">
                            <div className="flex items-center justify-between">
                                <span>Tổng loại sản phẩm: </span>
                                <span>{listOrder.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Tổng số lượng: </span>
                                <span>{listOrder.reduce((total, item) => total + item.quantity, 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Tổng tiền: </span>
                                <span className="text-xl text-red-500 font-medium">{formatCurrency(listOrder.reduce((total, item) => total + item.total_price, 0) - (invoice?.discount_amount || 0))}</span>
                            </div>
                        </div>
                        <div className="px-4 py-2 flex justify-end">
                            <Button 
                                type="primary" 
                                loading={loading}
                                onClick={() => handleCreateInvoice()}
                            >Tạo hóa đơn</Button>
                        </div>
                    </div>
                </div>
            </div>
            {contextHolder}
        </DashboardLayout>
    );
};

export default CreateInvoice;
