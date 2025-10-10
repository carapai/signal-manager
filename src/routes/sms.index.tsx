import { CheckCircleOutlined } from "@ant-design/icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute, useLoaderData } from "@tanstack/react-router";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Table,
    Tag,
    Typography,
    type TableProps,
} from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";
import { smsQueryOptions } from "../collections";
import { SMS } from "../types";
import { SMSRoute } from "./sms";
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
        form.setFieldsValue({});
    };

    const onCreate = async (values: any) => {
        const { district, ...dataValues } = values;
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
            title: "Status",
            dataIndex: "forwarded",
            key: "status",
            width: 100,
            render: (forwarded) =>
                forwarded ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        Forwarded
                    </Tag>
                ) : (
                    <Tag color="default">Pending</Tag>
                ),
        },
        {
            title: "Message",
            dataIndex: "text",
            key: "message",
            ellipsis: true,
        },
        {
            title: "Originator",
            dataIndex: "originator",
            key: "originator",
            width: 150,
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: "Received Date",
            dataIndex: "receiveddate",
            key: "timestamp",
            width: 180,
            render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
        },
        {
            title: "Actions",
            dataIndex: "actions",
            key: "actions",
            render: (_, record) => {
                return (
                    <Button
                        type={record.forwarded ? "default" : "primary"}
                        onClick={() => handleForward(record)}
                        style={
                            !record.forwarded
                                ? {
                                      background:
                                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                      border: "none",
                                  }
                                : undefined
                        }
                    >
                        {record.forwarded ? "Update" : "Forward"}
                    </Button>
                );
            },
            width: 120,
            align: "center",
        },
    ];

    return (
        <Card
            variant="borderless"
            style={{
                boxShadow:
                    "0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.05)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}
            styles={{ body: { padding: 16 } }}
        >
            <div style={{ flex: 1, overflow: "auto" }}>
                <Table
                    columns={columns}
                    dataSource={data.inboundsmss}
                    rowKey="id"
                    pagination={{
                        total: data.pager.total,
                        current: search.page,
                        pageSize: search.pageSize,
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
                        showSizeChanger: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} messages`,
                    }}
                    size="middle"
                />
            </div>
            <Modal
                open={open}
                title={
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        Create Signal from SMS
                    </Typography.Title>
                }
                okText="Create Signal"
                cancelText="Cancel"
                okButtonProps={{ autoFocus: true, htmlType: "submit" }}
                onCancel={() => setOpen(false)}
                destroyOnHidden
                modalRender={(dom) => (
                    <Form
                        layout="vertical"
                        form={form}
                        name="form_in_modal"
                        initialValues={{}}
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
        </Card>
    );
}
