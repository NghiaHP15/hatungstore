/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Invoice, Shipping, ShippingItem } from "@/app/types";
import { MODE } from "@/app/types/enum";
import _ from "lodash";
import { invoicesAPI, shippingAPI } from "@/lib/api";
import { Button, Input, List, message, Modal, Space } from "antd";
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { CloseOutlined, SearchOutlined, SwapOutlined } from "@ant-design/icons";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";

type Props = {
    reload: () => void
}

const ShippingDetail = forwardRef(({ reload }: Props, ref) => {

    const refDetail = useRef<any>(null);

    const [loading, setLoading] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    const refMode = useRef<{ data?: Shipping; mode: string }>({
        data: undefined,
        mode: MODE.CREATE,
    });

    useImperativeHandle(ref, () => ({
        create: (_data: Shipping) => {
        refMode.current = {
            data: _data,
            mode: MODE.CREATE,
        };
        setIsOpen(true);
        },
        update: (_data: Shipping) => {
        refMode.current = {
            data: _data,
            mode: MODE.UPDATE,
        };
        setIsOpen(true);
        },
    }));

    const afterOpenChange = (_open: boolean) => {
        if (_open) {
        if (refMode.current?.mode == MODE.CREATE) {
            refDetail.current.create(refMode.current?.data);
        }
        if (refMode.current?.mode == MODE.UPDATE) {
            refDetail.current.update(refMode.current?.data);
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

    const submitProject = () => {
        refDetail.current.submit();
    };


    return (
         <>
        <Modal
            title={refMode.current?.mode == MODE.CREATE ? 'Thêm đơn vận chuyển' : 'Cập nhật đơn vận chuyển'}
            open={isOpen}
            onCancel={closeModal}
            afterOpenChange={afterOpenChange}
            styles={{
            body: { flexGrow: 1 },
            content: { display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}}
            width="1200px"
            centered
            footer={[
                <Space key={"actions"} className="pr-3">
                    <Button
                    key="submit"
                    type="primary"
                    onClick={submitProject}
                    loading={loading}
                    disabled={loading}
                    >Lưu</Button>
                    <Button 
                    key="close-request" 
                    loading={loading} 
                    onClick={confirmClose}
                    disabled={loading}
                    >Đóng</Button>
                </Space>
            ]}
        >
            <ShippingDetailForm
            ref={refDetail}
            setLoading={setLoading}
            reload={reload}
            closeModal={closeModal}
            />
        </Modal>
    </>
    )
});

ShippingDetail.displayName = "ShippingDetail";

export default ShippingDetail;

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

const emptyItem: ShippingItem = {
    id: uuid(),
    invoice_id: "",
    invoice: null,
    prioritized: false,

};

const ShippingDetailForm = forwardRef(
  ({ setLoading, reload, closeModal }: FormProps, ref) => {
  
    const [mode, setMode] = useState<string>("");

    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const [searchInvoice, setSearchInvoice] = useState<string>('');

    const [loadingInvoice, setLoadingInvoice] = useState(false);

    const debouncedInvoice = useDebounce(searchInvoice, 500);

    const [param, setParam] = useState<Shipping>(emptyParameter);

    const [messageApi, contextHolder] = message.useMessage();

    const fetchInvoice = useCallback(async () => {
        try {
            setLoadingInvoice(true);
            const res = await invoicesAPI.getInvoices({ limit: 1000, status: false, search: debouncedInvoice });
            if (res.data.invoices) {
                setInvoices(res.data.invoices.filter((item: Invoice) => item.status === false));
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingInvoice(false);
        }
    }, [debouncedInvoice])

    useEffect(()=>{
        fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[reload, debouncedInvoice, closeModal]);

    useEffect(() => {
      setInvoices([]);
      setSearchInvoice('');      
    }, [closeModal]);

    const update = async (data: Shipping) => {
      const _param: Shipping = _.cloneDeep(data);
      setParam(_param);
      setMode(MODE.UPDATE);
    };

    const create = async () => {
      const _param: Shipping = _.cloneDeep({
        ...emptyParameter,
      });
      setParam(_param);
      setMode(MODE.CREATE);
    };

    useImperativeHandle(ref, () => ({
      create: create,

      update: update,

      submit: submitProject,

      reset: resetData,
    }));

    const submitProject = async () => {
      const _payload: any = _.cloneDeep(param);
      if(_payload.items.length === 0){
        messageApi.open({
            type: 'error',
            content: 'Vui lòng thêm đơn hàng',
        });
        return;
      }
      _payload.status = true;
      setLoading(true);
      try {
        if (mode === MODE.CREATE) {
          const res = await shippingAPI.createShipping(_payload);
          if (res) {
            reload();
            closeModal();
            resetData();
          }
        } else {
          const res = await shippingAPI.updateShipping(_payload.id, _payload);
          if (res) {
            reload();
            closeModal();
            resetData();
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    const resetData = () => {
      setParam(emptyParameter);
    };

    const handleOnDragEnd = (result: DropResult) => {
      if (!result.destination) return;

      const newItems: ShippingItem[] = param?.items || [];
      const [moved] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, moved);

      setParam({ ...param, items: newItems });
  };

    const addShippingBefore = (invoice: Invoice) => {
        const _param: Shipping = _.cloneDeep(param);
        _param.items?.push({ ...emptyItem, id: uuid(), invoice_id: invoice.id, invoice: {...invoice, status: true}, prioritized: true });
        setParam(_param);
    }

    const addShippingAfter = (invoice: Invoice) => {
        const _param: Shipping = _.cloneDeep(param);
        _param.items?.push({ ...emptyItem, id: uuid(), invoice_id: invoice.id, invoice: {...invoice, status: true}, prioritized: false });
        setParam(_param);
    }

    const resetBefore = () => {
      const _param: Shipping = _.cloneDeep(param);
      const _invoices: Invoice[] = _.cloneDeep(invoices);
      if(mode === MODE.UPDATE){
        const items = _param.items?.filter((item) => item.prioritized).map((item) => ({...item.invoice, status: false}) as Invoice ) || [];
        _param.items = _param.items?.filter((item) => !item.prioritized);
        setInvoices([..._invoices, ...items]);
        setParam(_param);
      }
      else {
        _param.items = _param.items?.filter((item) => !item.prioritized);
        setParam(_param);
      }
    }
    

    const resetAfter = () => {
      const _param: Shipping = _.cloneDeep(param);
      const _invoices: Invoice[] = _.cloneDeep(invoices);
      if(mode === MODE.UPDATE){
        const items = _param.items?.filter((item) => !item.prioritized).map((item) => ({...item.invoice, status: false}) as Invoice ) || [];
        _param.items = _param.items?.filter((item) => item.prioritized);
        setInvoices([..._invoices, ...items]);
        setParam(_param);
      }
      else {
        _param.items = _param.items?.filter((item) => item.prioritized);
        setParam(_param);
      }
    }

    const transfer = (record: ShippingItem) => {
        const _param: Shipping = _.cloneDeep(param);
        _param.items = _param.items?.map((item) => (item.id === record.id ? { ...item, prioritized: !item.prioritized }: item));
        setParam(_param);
    }

    const handleRemoveItem = (record: ShippingItem) => {
      if(mode === MODE.UPDATE){
        const _param: Shipping = _.cloneDeep(param);
        const _invoices: Invoice[] = _.cloneDeep(invoices);
        _param.items = _param.items?.filter((item) => item.id !== record.id);
        setParam(_param);
        if(record.invoice)
        setInvoices([..._invoices, record.invoice]);
      } else {
        const _param: Shipping = _.cloneDeep(param);
        _param.items = _param.items?.filter((item) => item.id !== record.id);
        setParam(_param);
      }
    }
  
    return (
      <div>
        <div className="grid grid-cols-3 gap-5">
            <div className="col-span-3"></div>
            <div className="border-r border-gray-200 pr-4">
              <div>
                <div className="px-2 mb-4">
                <Input value={searchInvoice} suffix={<SearchOutlined className="text-gray-300!" />} placeholder="Tìm kiếm mã đơn hàng" onChange={(e) => setSearchInvoice(e.target.value)} className="w-full rounded-sm!" />
                </div>
                <List
                  itemLayout="horizontal"
                  loading={loadingInvoice}
                  className="h-[750px] px-2! overflow-auto"
                  dataSource={invoices.filter((item) => param?.items?.findIndex((i) => i.invoice_id === item.id) === -1)}
                  renderItem={(item) => {
                    return(
                      <div className="py-1">
                        <div className="relative p-2 last:mb-0 border border-gray-200 rounded-sm px-2 flex gap-2 items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col font-roboto">
                              <span className="text-base">{!item.customer?.name ? "Khách hàng" : item.customer?.name}</span>
                              <span className="text-gray-500 line-clamp-1">{!item.customer?.address ? "Địa chỉ" : item.customer?.address}</span>
                              <span className="text-gray-500">{item.invoice_code} </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end font-roboto">
                            <span className="text-base font-medium text-red-400">{formatCurrency(item.total_amount || 0)}</span>
                          </div>
                          <div className="absolute top-0 right-0 w-full rounded-sm h-full flex items-center">
                            <div 
                              onClick={() => addShippingBefore(item)} 
                              className="group flex items-center justify-center h-full w-1/2 hover:bg-blue-200/70 hover:border hover:border-blue-300"
                              >
                              <span className="group-hover:text-blue-600 text-xl font-roboto text-transparent">Đầu</span>
                            </div>
                            <div 
                              onClick={() => addShippingAfter(item)}
                              className="group flex items-center justify-center h-full w-1/2 hover:bg-red-200/70 hover:border hover:border-red-300"
                            >
                              <span className="group-hover:text-red-600 text-xl font-roboto text-transparent">Đuôi</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
              </div>
            </div>
            <div className="border-r border-gray-200 pr-4">
              <div className="px-2 mb-4 flex items-center justify-between">
                <h2 className="text-base font-roboto">Danh sách đầu xe:</h2>
                <Button type="link" className="underline" onClick={() => resetBefore()}>Đặt lại</Button>
              </div>
              {param?.items && param?.items.length > 0 ? (
                <DragDropContext onDragEnd={handleOnDragEnd}>
                  <Droppable droppableId="list">
                    {(provided) => (
                      <ul
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="h-[750px] px-2! overflow-auto"
                      >
                        {param.items && param.items.filter((item) => (item.prioritized === true && item.invoice?.status === true)).map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id || ''} index={index}>
                            {(provided) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <div className="py-1">
                                <div className="group p-2 bg-white border border-gray-200 rounded-sm px-2 flex gap-2 items-center justify-between hover:bg-red-50 hover:border-red-300 transition-all duration-100">
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col font-roboto">
                                      <span className="text-base ">{!item.invoice?.customer ? 'Khách hàng' : item.invoice?.customer?.name} </span>
                                      <span className="text-gray-500 line-clamp-1">{!item.invoice?.customer?.address ? 'Địa chỉ' : item.invoice?.customer?.address}</span>
                                      <span className="text-gray-500">{item.invoice?.invoice_code}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 font-roboto">
                                    <span className="text-base font-medium text-red-400">{formatCurrency(item.invoice?.total_amount || 0)}</span>
                                    <SwapOutlined className="text-blue-400! cursor-pointer group-hover:w-5 w-0 h-5 transition-all duration-200" onClick={() => transfer(item)} />
                                    <CloseOutlined className="text-red-400! cursor-pointer group-hover:w-5 w-0 h-5 transition-all duration-200" onClick={() => handleRemoveItem(item)}/>
                                  </div>
                                </div>
                                </div>
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                </DragDropContext>
              ): (
                <></>
              )}
            </div>
            <div>
              <div className="px-2 mb-4 flex items-center justify-between">
                <h2 className="text-base font-roboto">Danh sách đuôi xe:</h2>
                <Button type="link" className="underline" onClick={() => resetAfter()}>Đặt lại</Button>
              </div>
              {param?.items && param?.items.length > 0 ? (
                <DragDropContext onDragEnd={handleOnDragEnd}>
                  <Droppable droppableId="list">
                    {(provided) => (
                      <ul
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="h-[750px] px-2! overflow-auto"
                      >
                        {param.items && param.items.filter((item) => (item.prioritized === false && item.invoice?.status === true)).map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id || ''} index={index}>
                            {(provided) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <div className="py-1">
                                <div className="group p-2 bg-white border border-gray-200 rounded-sm px-2 flex gap-2 items-center justify-between hover:bg-red-50 hover:border-red-300 transition-all duration-100">
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col font-roboto">
                                      <span className="text-base ">{!item.invoice?.customer?.name ? 'Khách hàng' : item.invoice?.customer?.name}</span>
                                      <span className="text-gray-500 line-clamp-1">{!item.invoice?.customer?.address? "Địa chỉ" : item.invoice?.customer?.address}</span>
                                      <span className="text-gray-500">{item.invoice?.invoice_code}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 font-roboto">
                                    <span className="text-base font-medium text-red-400">{formatCurrency(item.invoice?.total_amount || 0)}</span>
                                    <SwapOutlined className="text-blue-400! cursor-pointer group-hover:w-5 w-0 h-5 transition-all duration-200" onClick={() => transfer(item)} />
                                    <CloseOutlined className="text-red-400! cursor-pointer group-hover:w-5 w-0 h-5 transition-all duration-200" onClick={() => handleRemoveItem(item)}/>
                                  </div>
                                </div>
                                </div>
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                </DragDropContext>
              ): (
                <></>
              )}
            </div>
            <div className="col-span-3 px-2">
              <Input.TextArea value={param?.note} placeholder="Ghi chú" onChange={(e) => setParam({ ...param, note: e.target.value })} className="w-full rounded-sm! mb-4!"/>
            </div>
        </div>
        {contextHolder}
      </div>
    );
  },
);

ShippingDetailForm.displayName = 'ShippingDetailForm';

export {ShippingDetailForm};

