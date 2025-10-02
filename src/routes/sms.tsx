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
    const { engine, queryClient } = SMSRoute.useRouteContext();
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const navigate = SMSIndexRoute.useNavigate();
    const programStage = useLoaderData({ from: "__root__" });
    const search = SMSRoute.useSearch();
    const { data } = useSuspenseQuery(smsQueryOptions(engine, search));
    const [selectedSMS, setSelectedSMS] = useState<SMS | null>(null);

    const handleForward = (sms: SMS) => {
        setSelectedSMS(sms);
        setOpen(true);
        form.setFieldsValue({
            SXmppM2WKNo: "TTTTTTT",
        });
    };

    const onCreate = async (values: any) => {
        const { district, ...dataValues } = values;
        console.log("Forwarding SMS: ", selectedSMS, " with values: ", values);
        if (!selectedSMS) return;
        const response = await engine.mutate({
            resource: "events",
            type: "create",
            data: {
                events: [
                    {
                        event: selectedSMS.id,
                        programStage: "Nnnqw1XKpZL",
                        orgUnit: district,
                        program: "iaN1DovM5em",
                        eventDate: new Date().toISOString(),
                        status: "ACTIVE",
                        dataValues: Object.entries(dataValues).flatMap(
                            ([dataElement, value]) => {
                                if (value === undefined) return [];
                                if (value === null) return [];
                                if (value === false) return [];
                                return { dataElement, value };
                            },
                        ),
                    },
                ],
            },
            params: {
                async: false,
            },
        });
        queryClient.setQueryData(
            smsQueryOptions(engine, search).queryKey,
            (old: any) => {
                if (!old) return old;
                return (old as SMS[]).map((sms) => {
                    if (sms.id === selectedSMS.id) {
                        return {
                            ...sms,
                            forwarded: true,
                        };
                    }
                    return sms;
                });
            },
        );
        setOpen(false);
        form.resetFields();
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

            render: (_, record) => {
                if (record.forwarded)
                    return (
                        <Button onClick={() => handleForward(record)}>
                            Update
                        </Button>
                    );

                return (
                    <Button onClick={() => handleForward(record)}>
                        Forward
                    </Button>
                );
            },
            width: 50,
            align: "center",
        },
    ];
    return (
        <Flex vertical gap={10} style={{ width: "100%" }}>
            <Table
                columns={columns}
                dataSource={data.inboundsmss}
                rowKey="id"
                // bordered
                onRow={(record) => ({
                    style: {
                        backgroundColor:
                            record.forwarded === true ? "#eff7f0ff" : "none",
                    },
                })}
                pagination={{
                    total: data.pager.total,
                    current: data.pager.page,
                    pageSize: data.pager.pageSize,
                    onChange: (page, pageSize) => {
                        if (pageSize !== search.pageSize) {
                            navigate({
                                search: (prev) => ({
                                    ...prev,
                                    page: 1,
                                    pageSize,
                                }),
                            });
                            return;
                        } else {
                            navigate({
                                search: (prev) => ({
                                    ...prev,
                                    page,
                                }),
                            });
                        }
                    },
                }}
            />
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
                        initialValues={{ SXmppM2WKNo: "TTTTTTT" }}
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
                                    <Select
                                        options={dataElement.optionSet.options.map(
                                            (option) => ({
                                                label: option.name,
                                                value: option.code,
                                            }),
                                        )}
                                    />
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
