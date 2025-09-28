/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import React, { useEffect, useRef, useState } from "react";
import { Category, ProductUnit, UnitProduct } from "../../types";
import { no_image } from "@/images";
import { Button, Flex, Image, Input, Select, Space, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined, LeftOutlined, PlusOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons";
import { categoriesAPI, productsAPI, productunitsAPI } from "@/lib/api";
import PageSizeOption from "@/components/PageSizeOption";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils";
import ProductUnitDetail from "@/components/model/UnitProductModel";
import ProductDetail from "@/components/model/ProductModel";

const ProductPage = () => {
    const [loading, setLoading] = useState(false);
    const [lazyParams, setLazyParams] = useState({
    page: 0,
    size: 20,
    search: "",
    category: "",
    limit: 1000,
    });
    const [data, setData] = useState<UnitProduct[]>([]);
    const debouncedValue = useDebounce(lazyParams.search, 500);
    const [categories, setCategories] = useState<Category[]>([]);
    const refUnitProduct = useRef<any>(null);
    const refProduct = useRef<any>(null);

    const fetchProducts = async () => {
        try{
            setLoading(true);
            const res = await productunitsAPI.getProductUnits({ limit: lazyParams.limit, search: debouncedValue, category: lazyParams.category });
            
            if(res.data.product_units){
                setData(res.data.product_units)
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
    }, [lazyParams.limit,  debouncedValue, lazyParams.category]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoriesAPI.getCategories();
                
                if(res.data.categories){
                    setCategories(res.data.categories)
                }
            } catch (error) {
                console.error(error);
            }
        }
        fetchCategories();
    }, []);


    const column: any = [
        {
            key: 'index',
            title: '#',
            render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
            width: 50,
        },
        {
            key: 'image',
            title: "Ảnh",
            dataIndex: 'image',
            width: 100,
            render: (_: any, record: UnitProduct) => (
            <div className="flex items-center rounded-md w-max h-max overflow-hidden">
                <Image
                    width={50}
                    height={50}
                    src={record.product?.image_url || no_image.src}
                    alt={record?.product?.name}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback={no_image.src}
                    />
            </div>
            )
        },
        {
            key: 'name',
            title: "Tên sản phẩm",
            dataIndex: 'name',
            width: 200,
            render: (_: any, record: UnitProduct) => <span className="line-clamp-2">{record?.name}</span>
        },
        {
            key: 'category',
            title: "Danh mục",
            dataIndex: 'category',
            width: 150,
            render: (_: any, record: UnitProduct) => <span className="line-clamp-2">{record?.product?.category?.name}</span>
        },
        {
            key: 'unit',
            title: "Đơn vị",
            dataIndex: 'unit',
            width: 100,
            render: (_: any, record: UnitProduct) => <span className="line-clamp-2">{record?.unit_name}</span>
        },
        {
            key: 'price',
            title: "Giá",
            dataIndex: 'price',
            width: 150,
            render: (_: any, record: UnitProduct) => <span className="line-clamp-2">{formatCurrency(record?.price)}</span>
        },
        {
            key: 'action',
            title: "Hành động",
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_: any, record: UnitProduct) => (
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

    const onCreateProductUnit = () => {
        refUnitProduct.current.create();
    };

    const onCreateProduct = () => {
        refProduct.current.create();
    }

    const onEdit = (formValue: ProductUnit) => {
        refUnitProduct.current.update({ ...formValue })
    };

    const onDelete = async (id: string) => {
        if(!id) return;
        try {
        setLoading(true);
        const res = await productunitsAPI.deleteProductUnit(id);
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
                        onClick={onCreateProductUnit} 
                        icon={<PlusOutlined className="text-white"/>}
                    >
                    Thêm mặt hàng
                    </Button>
                    <Button 
                        type="primary" 
                        className="font-roboto"
                        onClick={onCreateProduct} 
                        icon={<PlusOutlined className="text-white"/>}
                    >
                    Thêm nhóm mặt hàng
                    </Button>
                </Space>
                <Space>
                    <Input placeholder="Tìm kiếm ..." suffix={<SearchOutlined className="text-gray-400!" />} onChange={(e) => onChangeSearch(e.target.value, 'search')} />
                    <Select placeholder="Danh mục" onClear={() => onChangeSearch('', 'category')} fieldNames={{ label: 'name', value: 'id' }} options={categories || []} className="w-[200px] font-roboto" onChange={(e) => onChangeSearch(e, 'category')} />
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
            <ProductUnitDetail
                ref={refUnitProduct} 
                reload={reload}
            />
            <ProductDetail
                ref={refProduct} 
                reload={reload}
            />
        </DashboardLayout>
    );
};

export default ProductPage;
