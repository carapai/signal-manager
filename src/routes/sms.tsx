import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute, Outlet, useLoaderData } from "@tanstack/react-router";
import React, { useState } from "react";
import { smsQueryOptions } from "../collections";
import { RootRoute } from "./__root";
import {
    Button,
    Col,
    DatePicker,
    Flex,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Typography,
    type TableProps,
} from "antd";
import { SMS, SMSSearchParams } from "../types";

export const SMSRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/sms",
    component: () => {
        const navigate = SMSRoute.useNavigate();
        return (
            <Flex vertical gap={10} style={{ width: "100%" }}>
                <Typography.Title level={2} style={{ padding: 0, margin: 0 }}>
                    SMS Messages
                </Typography.Title>
                <Input.Search
                    placeholder="Search SMS"
                    style={{ marginBottom: 10, width: 300 }}
                    onSearch={(value) =>
                        navigate({
                            search: (prev) => ({ ...prev, q: value, page: 1 }),
                        })
                    }
                />
                <Outlet />
            </Flex>
        );
        ``;
    },
    validateSearch: SMSSearchParams,
});

export const SMSIndexRoute = createRoute({
    getParentRoute: () => SMSRoute,
    path: "/",
    component: SMSRouteComponent,
    loaderDeps: ({ search }) => search,
    loader: ({ context: { queryClient, engine }, deps }) => {
        return queryClient.ensureQueryData(smsQueryOptions(engine, deps));
    },
});

function SMSRouteComponent() {
    const { engine } = SMSRoute.useRouteContext();
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const [formValues, setFormValues] = useState<any>();
    const programStage = useLoaderData({ from: "__root__" });
    const search = SMSRoute.useSearch();
    const { data } = useSuspenseQuery(smsQueryOptions(engine, search));

    const handleForward = (sms: SMS) => {
        setOpen(true);
    };

    const onCreate = (values: any) => {
        console.log("Received values of form: ", values);
        setFormValues(values);
        setOpen(false);
    };

    const columns: TableProps<SMS>["columns"] = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "Message",
            dataIndex: "text",
            key: "message",
        },
        {
            title: "Originator",
            dataIndex: "originator",
            key: "originator",
        },
        {
            title: "Received Date",
            dataIndex: "receiveddate",
            key: "timestamp",
        },
        {
            title: "Actions",
            dataIndex: "actions",
            key: "actions",
            render: (_, record) => (
                <Space size="middle">
                    <Button onClick={() => handleForward(record)}>
                        Forward
                    </Button>
                </Space>
            ),
            width: 50,
            align: "center",
        },
    ];
    return (
        <Flex vertical gap={10} style={{ width: "100%" }}>
            <Table columns={columns} dataSource={data} rowKey="id" bordered />
            <Modal
                open={open}
                title="Create a new signal"
                okText="Create Signal"
                cancelText="Cancel Signal"
                okButtonProps={{ autoFocus: true, htmlType: "submit" }}
                onCancel={() => setOpen(false)}
                destroyOnHidden
                modalRender={(dom) => (
                    <Form
                        layout="vertical"
                        form={form}
                        name="form_in_modal"
                        initialValues={{ modifier: "public" }}
                        clearOnDestroy
                        onFinish={(values) => onCreate(values)}
                    >
                        {dom}
                    </Form>
                )}
                width="70%"
            >
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item
                            label="District"
                            name="district"
                            rules={[
                                {
                                    required: true,
                                    message: "Please select a district",
                                },
                            ]}
                        >
                            <Select
                                options={programStage.assignedDistricts}
                                showSearch
                                placeholder="Select a district"
                                filterOption={(input, option) =>
                                    option
                                        ? option.label
                                              .toLowerCase()
                                              .includes(input.toLowerCase())
                                        : false
                                }
                            />
                        </Form.Item>
                    </Col>
                    {programStage.programStageSections[0].dataElements.map(
                        (de) => {
                            const dataElement =
                                programStage.programStageDataElements.get(de);
                            let element = <Input />;
                            if (
                                dataElement?.optionSetValue &&
                                dataElement?.optionSet
                            ) {
                                element = (
                                    <Select>
                                        {dataElement.optionSet?.options.map(
                                            (option) => (
                                                <Select.Option
                                                    key={option.id}
                                                    value={option.id}
                                                >
                                                    {option.name}
                                                </Select.Option>
                                            ),
                                        )}
                                    </Select>
                                );
                            }
                            if (dataElement?.valueType === "BOOLEAN") {
                                element = <Input type="checkbox" />;
                            }
                            if (
                                dataElement?.valueType === "DATE" ||
                                dataElement?.valueType === "DATETIME"
                            ) {
                                element = (
                                    <DatePicker style={{ width: "100%" }} />
                                );
                            }
                            if (dataElement?.valueType === "LONG_TEXT") {
                                element = <Input.TextArea rows={4} />;
                            }

                            if (
                                [
                                    "NUMBER",
                                    "INTEGER",
                                    "INTEGER_POSITIVE",
                                ].includes(dataElement?.valueType ?? "")
                            ) {
                                element = (
                                    <InputNumber style={{ width: "100%" }} />
                                );
                            }

                            return (
                                <Col span={8} key={de}>
                                    <Form.Item
                                        key={de}
                                        label={
                                            dataElement?.formName ??
                                            dataElement?.name
                                        }
                                        name={de}
                                        rules={[
                                            {
                                                required:
                                                    dataElement?.compulsory,
                                                message: `${dataElement?.name} is required`,
                                            },
                                        ]}
                                    >
                                        {element}
                                    </Form.Item>
                                </Col>
                            );
                        },
                    )}
                </Row>
            </Modal>
        </Flex>
    );
}
