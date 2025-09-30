/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button, Flex, Form, Input, InputNumber, Space, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined, LeftOutlined, PlusOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps, ColumnType } from "antd/es/table";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Category } from "../types";
import { useDebounce } from "@/hooks/useDebounce";
import { categoriesAPI } from "@/lib/api";
import PageSizeOption from "@/components/PageSizeOption";
import { toLowerCaseNonAccent } from "@/lib/utils";

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: keyof Category;
  name: React.ReactNode;
  inputType: "text" | "number";
  record: Category;
  index: number;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  editing,
  dataIndex,
  name,
  inputType,
  children,
  ...restProps
}) => {
  const inputNode = inputType === "number" ? <InputNumber /> : <Input />;

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `Vui lòng nhập ${String(name).toLowerCase()}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const CategoryPage = () => {
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [lazyParams, setLazyParams] = useState({
    page: 0,
    size: 20,
    search: "",
    limit: 1000,
  });
  const [data, setData] = useState<Category[]>([]);
  const [editingKey, setEditingKey] = useState("");
  const debouncedValue = useDebounce(lazyParams.search, 500);
  const [loadingAction, setLoadingAction] = useState(false);
  const [form] = Form.useForm();

  const isEditing = (record: Category) => record.id === editingKey;

  const edit = (record: Category) => {
    form.setFieldsValue({ name: record.name });
    setEditingKey(record?.id || "");
  };

  const cancel = () => {
    if (isCreating) {
      setData((prev) => prev.filter((item) => item.id !== "new"));
      setIsCreating(false);
    }
    setEditingKey("");
  };

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const res = await categoriesAPI.getCategories({
        limit: lazyParams.limit,
        search: debouncedValue,
      });
      if (res.data.categories) {
        setData(res.data.categories);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lazyParams.limit, debouncedValue]);

  useEffect(() => {
    setColumns(columnsTable);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingKey]);

  const columnsTable: ColumnType<Category>[] = [
    {
      key: "index",
      title: "#",
      render: (_: unknown, __: Category, index: number) => (
        <span>{index + 1}</span>
      ),
      width: 50,
    },
    {
      key: "name",
      title: "Tên danh mục",
      dataIndex: "name",
      width: 200,
      render: (value: string) => (
        <span className="line-clamp-2">{value}</span>
      ),
    },
    {
      key: "action",
      title: "Hoạt động",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_: unknown, record: Category) => {
        const editable = isEditing(record);

        return (
          <Space key={record.id}>
            {editable ? (
              <span>
                <Typography.Link
                  onClick={() => save(record.id || "new")}
                  style={{ marginInlineEnd: 8 }}
                >
                  Lưu
                </Typography.Link>
                <Typography.Text
                  onClick={cancel}
                  className="cursor-pointer"
                >
                  Hủy
                </Typography.Text>
              </span>
            ) : (
              <Button
                icon={<EditOutlined className="text-blue-500!" />}
                className="border-blue-500!"
                loading={loadingAction}
                onClick={() => edit(record)}
              />
            )}
            {isCreating && record.id === "new" ? null : (
              <Button
                icon={<DeleteOutlined className="text-red-500!" />}
                className="border-red-500!"
                loading={loadingAction}
                onClick={() => onDelete(record)}
              />
            )}
          </Space>
        );
      },
    },
  ];

  const mergedColumns: TableProps<Category>["columns"] = columns?.map((col) => {
    if (!col?.dataIndex) return col;
    return {
      ...col,
      onCell: (record: Category) => ({
        record,
        inputType: "text",
        dataIndex: col.dataIndex as keyof Category,
        name: col.name,
        editing: isEditing(record),
      }),
    };
  });

  const reload = () => {
    fetchCategory();
  };

  const onCreate = () => {
    if (isCreating) return;
    const newRow: Category = {
      id: "new",
      name: "",
    };

    setData((prev) => [newRow, ...prev]);

    form.setFieldsValue({
      name: "",
    });
    setEditingKey("new");
    setIsCreating(true);
  };

  const save = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as Category;
      if (isCreating && key === "new") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...payload } = row;
        setLoadingAction(true);
        const res = await categoriesAPI.createCategory(payload);
        setLoadingAction(false);
        if (res) reload();
        setIsCreating(false);
        setEditingKey("");
        return;
      }
      const index = data.findIndex((item) => key === item.id);
      if (index > -1) {
        setLoadingAction(true);
        const res = await categoriesAPI.updateCategory(key as string, row);
        setLoadingAction(false);
        if (res) reload();
        setEditingKey("");
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const onDelete = async (formValue: Category) => {
    if (!formValue.id) return;
    try {
      setLoadingAction(true);
      const res = await categoriesAPI.deleteCategory(formValue.id);
      setLoadingAction(false);
      if (res) reload();
    } catch (error) {
      console.error(error);
    }
  };

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

    const onChangeSearch = (value: string, key: string) => {
        setLazyParams({
        ...lazyParams,
        [key]: value,
        });
    };

  return (
    <DashboardLayout>
      <Flex vertical className="h-full">
        <Flex
          justify="space-between"
          className="mb-3! p-3! rounded-md bg-gray-50"
        >
          <Space>
            <Button
              type="primary"
              onClick={onCreate}
              icon={<PlusOutlined className="text-white" />}
            >
              Thêm danh mục
            </Button>
          </Space>
          <Space>
                <Input placeholder="Tìm kiếm ..." suffix={<SearchOutlined className="text-gray-400!" />} onChange={(e) => onChangeSearch(toLowerCaseNonAccent(e.target.value), 'search')} />
            </Space>
        </Flex>
        <Form form={form} component={false}>
          <Table<Category>
            rowKey="id"
            size="small"
            className="relative"
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            rowClassName="editable-row"
            scroll={{ x: "w-full" }}
            loading={loading}
            pagination={{
              responsive: true,
              total: data.length,
              itemRender(page, type, originalElement) {
                if (type === "prev") {
                  return (
                    <Button
                      size="small"
                      className="mr-1 ml-2 !rounded-sm"
                      icon={<LeftOutlined style={{ fontSize: "12px" }} />}
                    />
                  );
                }
                if (type === "next") {
                  return (
                    <Button
                      size="small"
                      className="ml-1 mr-2 !rounded-sm"
                      icon={<RightOutlined style={{ fontSize: "12px" }} />}
                    />
                  );
                }
                if (type === "page") {
                  return <a>{page}</a>;
                }
                return originalElement;
              },
              pageSize: lazyParams.size,
              size: "small",
              current: lazyParams.page + 1,
              showTotal: (total) => (
                <div className="absolute left-2">
                  <Space>
                    <Typography.Text className="text-sm font-normal">
                      Hiển thị
                      {total > 0
                        ? `${lazyParams.page * lazyParams.size + 1} - ${Math.min(
                            (lazyParams.page + 1) * lazyParams.size,
                            total
                          )} (${total})`
                        : "0 / 0"}
                    </Typography.Text>
                    <PageSizeOption
                      pageSize={lazyParams.size}
                      onChange={changePageSize}
                    />
                  </Space>
                </div>
              ),
              onChange: onPage,
            }}
            columns={mergedColumns}
            dataSource={data}
          />
        </Form>
      </Flex>
    </DashboardLayout>
  );
};

export default CategoryPage;
