/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Shipping } from "@/app/types";
import { MODE } from "@/app/types/enum";
import _ from "lodash";
import { Button, List, Modal, Space } from "antd";
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { PrinterOutlined } from "@ant-design/icons";
import { useReactToPrint } from "react-to-print";

type Props = {
    reload: () => void
}

const ShippingViewDetail = forwardRef(({ reload }: Props, ref) => {

    const refDetail = useRef<any>(null);

    const [loading, setLoading] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    const refMode = useRef<{ data?: Shipping; mode: string }>({
        data: undefined,
        mode: MODE.CREATE,
    });

    useImperativeHandle(ref, () => ({
        view: (_data: Shipping) => {
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

    const submitPrint = () => {
        refDetail.current.submit();
    };

    return (
         <>
        <Modal
            title={"Thống tin đơn vận"}
            open={isOpen}
            onCancel={closeModal}
            afterOpenChange={afterOpenChange}
            styles={{
            body: { flexGrow: 1 },
            content: { display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}}
            width="1000px"
            centered
            footer={[
                <Space key={"actions"} className="pr-3">
                    <Button
                    key="submit"
                    type="primary"
                    onClick={submitPrint}
                    icon={<PrinterOutlined/>}
                    loading={loading}
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
            <ShippingViewDetailForm
            ref={refDetail}
            setLoading={setLoading}
            reload={reload}
            closeModal={closeModal}
            />
        </Modal>
    </>
    )
});

ShippingViewDetail.displayName = "ShippingViewDetail";

export default ShippingViewDetail;

type FormProps = {
  reload: () => void;
  setLoading: (i: boolean) => void;
  closeModal: () => void;
};

const emptyParameter: Shipping = {
    id: uuid(),
    note: "",
    status: false,
    items: [],
};

const ShippingViewDetailForm = forwardRef(
  ({ }: FormProps, ref) => {
  
    const [, setMode] = useState<string>("");

    const [param, setParam] = useState<Shipping>(emptyParameter);

    const shippingRef = useRef<HTMLDivElement>(null);

    const view = async (data: Shipping) => {
      const _param: Shipping = _.cloneDeep(data);
      setParam(_param);
      setMode(MODE.VIEW);
    };
    useImperativeHandle(ref, () => ({
      view: view,

      submit: submitPrint,

      reset: resetData,
    }));

    const data_shipping = useMemo(() => {
        const shipping: Shipping = _.cloneDeep(param);

        // Gom theo product_unit.id
        const prioritizedProducts: Record<
            string,
            { product_unit: any; totalQuantity: number; customers: { customer: any; quantity: number, product_unit: string }[] }
        > = {};

        const nonPrioritizedProducts: Record<
            string,
            { product_unit: any; totalQuantity: number; customers: { customer: any; quantity: number, product_unit: string }[] }
        > = {};

        if (shipping.items && shipping.items.length > 0) {
            for (const item of shipping.items) {
            const invoice = item.invoice;
            const invoiceItems = invoice?.items || [];
            const customer = invoice?.customer;
            if (!customer) continue;

            const target = item.prioritized ? prioritizedProducts : nonPrioritizedProducts;

            for (const invItem of invoiceItems) {
                const pu = invItem.product_unit;
                if (!pu) continue;

                if (!target[pu.id]) {
                target[pu.id] = { product_unit: pu, totalQuantity: 0, customers: [] };
                }

                target[pu.id].totalQuantity += invItem.quantity;

                // check nếu customer đã có trong list thì cộng dồn, chưa có thì thêm mới
                const existingCustomer = target[pu.id].customers.find(c => c.customer.id === customer.id);
                if (existingCustomer) {
                existingCustomer.quantity += invItem.quantity;
                } else {
                target[pu.id].customers.push({ customer, quantity: invItem.quantity, product_unit: pu.unit_name });
                }
            }
            }
        }

        const prioritizedItems = Object.values(prioritizedProducts);
        const nonPrioritizedItems = Object.values(nonPrioritizedProducts);

        return {
            prioritizedItems,
            nonPrioritizedItems,
            totalPrioritizedQuantity: prioritizedItems.reduce((s, i) => s + i.totalQuantity, 0),
            totalNonPrioritizedQuantity: nonPrioritizedItems.reduce((s, i) => s + i.totalQuantity, 0),
        };
    }, [param]);

    console.log(data_shipping);
    

    const submitPrint = useReactToPrint({
            contentRef:  shippingRef, 
            pageStyle: `
            @page { size: A5 portrait; margin: 10mm; padding: 5mm; }
            @media print {
                body { -webkit-print-color-adjust: exact; }
            }
            `,
        });

    const resetData = () => {
      setParam(emptyParameter);
    };
   
    return (
      <div ref={shippingRef}>
        <div className="grid grid-cols-2">
            <div className="pr-4">
                <div>
                    <h2 className="text-base font-roboto border-l-3 border-red-400 pl-2">Đầu xe:</h2>
                    <List
                        dataSource={data_shipping.prioritizedItems}
                        renderItem={(item) => (
                        <List.Item className="flex flex-col">
                            <div className="flex justify-between items-center w-full text-base font-roboto border-gray-200">
                                <span>{item.product_unit.name}</span>
                                <span className="text-sm font-roboto text-gray-400">Số lượng x <span className="text-base text-gray-800">{item.totalQuantity}</span></span>
                            </div>
                            <div className="flex gap-2 flex-wrap items-center justify-start w-full">
                                {item.customers.map((customer,index) => (
                                <>
                                <div key={customer.customer.id}>
                                    <span className="text-sm font-roboto text-gray-400">{customer.customer.name}</span>
                                    <span className="text-sm font-roboto text-gray-400">: <span className="text-gray-400">{customer.quantity} {customer.product_unit}</span></span>
                                </div>
                                <span className="text-sm font-roboto text-gray-400">{item.customers.length - 1 === index ? "" : " - "}</span>
                                </>
                                ))}
                            </div>
                        </List.Item>
                        )}
                    />
                    <div className="mt-2 pt-2 border-t border-gray-400 flex justify-between items-center w-full text-base font-roboto">
                        <span>Tổng số lượng:</span>
                        <span>{data_shipping.totalPrioritizedQuantity}</span>
                    </div>
                </div>
            </div>
            <div className="pl-4 border-l border-gray-200">
                <div>
                    <h2 className="text-base font-roboto border-l-3 border-red-400 pl-2">Đuôi xe</h2>
                    <List
                        dataSource={data_shipping.nonPrioritizedItems}
                        renderItem={(item) => (
                        <List.Item className="flex flex-col">
                            <div className="flex justify-between items-center w-full text-base font-roboto border-gray-200">
                                <span>{item.product_unit.name}</span>
                                <span className="text-sm font-roboto text-gray-400">Số lượng x <span className="text-base text-gray-800">{item.totalQuantity}</span></span>
                            </div>
                            <div className="flex gap-2 flex-wrap items-center justify-start w-full">
                                {item.customers.map((customer,index) => (
                                <>
                                <div key={customer.customer.id}>
                                    <span className="text-sm font-roboto text-gray-400">{customer.customer.name}</span>
                                    <span className="text-sm font-roboto text-gray-400">: <span className="text-gray-400">{customer.quantity} {customer.product_unit}</span></span>
                                </div>
                                <span className="text-sm font-roboto text-gray-400">{item.customers.length - 1 === index ? "" : " - "}</span>
                                </>
                                ))}
                            </div>
                        </List.Item>
                        )}
                    />
                    <div className="mt-2 pt-2 border-t border-gray-400 flex justify-between items-center w-full text-base font-roboto">
                        <span>Tổng số lượng:</span>
                        <span>{data_shipping.totalNonPrioritizedQuantity}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  },
);

ShippingViewDetailForm.displayName = 'ShippingViewDetailForm';

export {ShippingViewDetailForm};

