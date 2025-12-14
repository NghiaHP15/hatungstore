/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Invoice } from "@/app/types";
import { MODE } from "@/app/types/enum";
import _ from "lodash";
import { Button, Image, Modal, Space, Table } from "antd";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import dayjs from "dayjs";
import { qr_pay } from "@/images";
import { formatCurrency } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import { LoadingOutlined, PrinterOutlined } from "@ant-design/icons";
import { storeAPI } from "@/lib/api";

type Props = {
    reload: () => void
}

const InvoiceDetail = forwardRef(({ reload }: Props, ref) => {

    const refDetail = useRef<any>(null);

    const [loading, setLoading] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    const refMode = useRef<{ data?: Invoice; mode: string }>({
        data: undefined,
        mode: MODE.VIEW,
    });

    useImperativeHandle(ref, () => ({
        view: (_data: Invoice) => {
        refMode.current = {
            data: _data,
            mode: MODE.VIEW,
        };
        setIsOpen(true);
        },
    }));

    const afterOpenChange = (_open: boolean) => {
        if (_open) {
            if (refMode.current?.mode == MODE.VIEW) {
                refDetail.current.view(refMode.current?.data);
            }
        }
    };

    const closeModal = () => {
        setIsOpen(false);
        refDetail.current.reset();
    };

    const confirmClose = () => {
        setIsOpen(false);
    };

    const print = () => {
        refDetail.current.print();
    }

    return (
         <>
        <Modal
            title="Chi tiết đơn hàng"
            open={isOpen}
            onCancel={closeModal}
            afterOpenChange={afterOpenChange}
            styles={{
            body: { flexGrow: 1 },
            content: { display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}}
            width="800px"
            centered
            footer={[
                <Space key={"actions"} className="pr-3">
                    <Button 
                    key="print" 
                    type="primary" 
                    onClick={print}
                    loading={loading} 
                    icon={<PrinterOutlined/>}
                    disabled={loading}
                    >In</Button>
                    <Button 
                    key="close-request" 
                    loading={loading} 
                    onClick={confirmClose}
                    disabled={loading}
                    >Đóng</Button>
                </Space>
            ]}
        >
            <InvoiceDetailForm
            ref={refDetail}
            setLoading={setLoading}
            reload={reload}
            closeModal={closeModal}
            />
        </Modal>
    </>
    )
});

InvoiceDetail.displayName = "InvoiceDetail";

export default InvoiceDetail;

type FormProps = {
  reload: () => void;
  setLoading: (i: boolean) => void;
  closeModal: () => void;
};

const emptyParameter: Invoice = {
    id: "",
    invoice_code: "",
    amount: 0,
    cashier_id: "",
    status: false,
    discount_amount: 0,
    total_amount: 0,
    created_at: "",
    items: [],
    customer: undefined,
    cashier: undefined
};

const emptyStore = {
    store: "",
    address: "",
    phone: "",
    email: "",
    owner: "",
    name_bank: "",
    number_bank: "",
    account_bank: "",
    qr_code: "",
}

const InvoiceDetailForm = forwardRef(
  ({ }: FormProps, ref) => {
  
    const [, setMode] = useState<string>(MODE.CREATE);

    const [param, setParam] = useState<Invoice>(emptyParameter);

    const invoiceRef = useRef<HTMLDivElement>(null);

    const [store, setStore] = useState(emptyStore);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await storeAPI.getStore();
                if(res.data){
                    setStore(res.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [])

    const view = async (data: Invoice) => {
      const _param: Invoice = _.cloneDeep(data);
      setParam(_param);
      setMode(MODE.UPDATE);
    };

    useImperativeHandle(ref, () => ({
      view: view,

      print: handlePrint,

      reset: resetData,
    }));

    const resetData = () => {
      setParam(emptyParameter);
    };

    const handlePrint = useReactToPrint({
        contentRef:  invoiceRef, 
        pageStyle: `
        @page { size: A5 portrait; margin: 5mm; padding: 3mm; }
        @media print {
            body { -webkit-print-color-adjust: exact; }
        }
        `,
    });

    return (
        loading ? 
        (<>
        <div className="flex justify-center items-center h-full p-5">
            <LoadingOutlined spin className="text-4xl! text-red-400!" />
        </div>
        </>) : 
        (
            <div id="invoice-section" ref={invoiceRef}>
                <div className='grid grid-cols-5 font-roboto'>
                    <div className="col-span-2 border-b border-gray-300">
                        <h1 className="text-5xl uppercase font-medium">{store.store}</h1>
                        <div className='font-base'>
                            <span>Địa chỉ: </span>
                            <span>{store.address}</span>
                        </div>
                        <div className='font-base font-medium'>
                            <span>SĐT: </span>
                            <span>{store.phone}</span>
                        </div>
                    </div>
                    <div className="col-span-1 border-b border-gray-300">
                        <Image
                        width={100}
                        height={100}
                            src={ store.qr_code || qr_pay.src}
                        alt="logo"
                        preview={false}
                        />
                    </div>
                    <div className="col-span-2 border-b border-gray-300">
                        <h2 className="text-xl uppercase">Hóa đơn bán hàng</h2>
                        <div className=''>
                            <span>Ngân hàng: </span>
                            <span className="font-medium">{store.name_bank}</span>
                        </div>
                        <div className=''>
                            <span>Tên: </span>
                            <span className="font-medium">{store.owner}</span>
                        </div>
                        <div className=''>
                            <span>Số tài khoản: </span>
                            <span className="font-medium">{store.account_bank}</span>
                        </div>
                    </div>
                    <div className="col-span-3 mt-2">
                        <div className=''>
                            <span>Tên khách hàng: </span>
                            <span>{param.customer?.name}</span>
                        </div>
                        <div className=''>
                            <span>Số điện thoại: </span>
                            <span>{param.customer?.phone}</span>
                        </div>
                        <div className=''>
                            <span>Địa chỉ: </span>
                            <span>{param.customer?.address}</span>
                        </div>
                    </div>
                    <div className="col-span-2 mt-2">
                        <div className=''>
                            <span>Mã đơn hàng: </span>
                            <span>{param.invoice_code}</span>
                        </div>
                        <div className=''>
                            <span>Ngày tạo đơn: </span>
                            <span>{dayjs(param.created_at).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY")}</span>
                        </div>
                    </div>
              </div>
              <div>
                  <div className='mt-4'>
                    <Table
                      key="id"
                      className="invoice-detail"
                      size={'small'}
                      bordered={false}
                      columns={[
                          {
                              key: 'index',
                              title: '#',
                              render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
                              width: 50,
                          },
                          {
                              title: "Sản phẩm",
                              dataIndex: 'name',
                              key: 'name',
                              render: (_, record) => <span className="text-base font-medium text-gray-800">{record.product_unit?.name}</span>,
                          },
                          {
                              title: "Số lượng",
                              dataIndex: 'count',
                              key: 'count',
                              align: 'center',
                              render: (_, record) => <span>{record.quantity}</span>,
                          },
                          {
                              title: "Đơn vị tính",
                              dataIndex: 'unit_name',
                              align: 'right',
                              key: 'unit_name',
                              render: (_, record) => <span>{record.product_unit?.unit_name}</span>,
                          },
                          {
                              title: "Đơn giá",
                              dataIndex: 'price',
                              align: 'right',
                              key: 'price',
                              render: (_, record) => <span>{formatCurrency(record.unit_price || 0)}</span>,
                          },
                          {
                              title: "Thành tiền",
                              dataIndex: 'total_price',
                              align: 'right',
                              key: 'total_price',
                              render: (_, record) => <span className="text-base font-medium text-gray-800">{formatCurrency(record.total_price)}</span>,
                          },
                      ]}
                      dataSource={param.items}
                      pagination={false}
                    />
                  </div>
                  <div className='mt-4'>
                      <div className='flex justify-end items-center font-roboto'>
                          <span className='font-medium w-50'>Tổng tiền:</span>
                          <span className="font-medium text-base">{formatCurrency(param.total_amount || 0)}</span>
                      </div>
                  </div>
                </div>
            </div>
        )
    );
  },
);

InvoiceDetailForm.displayName = 'InvoiceDetailForm';

export {InvoiceDetailForm};

