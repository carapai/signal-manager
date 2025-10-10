import React from "react";

import { useLoaderData } from "@tanstack/react-router";
import {
    Checkbox,
    Col,
    DatePicker,
    Flex,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Tabs,
} from "antd";
import dayjs from "dayjs";
import { orderBy, set } from "lodash";
import { db } from "../db";
import { SignalsRoute } from "../routes/signals";
import { EventWithValues } from "../types";
import { nextAction } from "../utils";

export default function SignalModal({
    open,
    setOpen,
    actions: { next, active },
    values,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    actions: ReturnType<typeof nextAction>;
    values: EventWithValues | null;
}) {
    const [current, setCurrent] = React.useState<string>(() => next);
    const { programStageSections, programStageDataElements } = useLoaderData({
        from: "__root__",
    });
    const { engine, queryClient } = SignalsRoute.useRouteContext();
    const search = SignalsRoute.useSearch();
    const [form] = Form.useForm();
    const onCreate = async (updatedValues: any) => {
        if (values) {
            const mergedValues: Record<string, string> = {
                ...values.dataValues,
                ...updatedValues,
            };
            const dataValues = Object.entries(mergedValues).flatMap(
                ([key, value]: [string, any]) => {
                    const element = programStageDataElements.get(key);
                    if (element?.valueType === "BOOLEAN") {
                        return {
                            dataElement: key,
                            value: value === "true",
                        };
                    } else if (value) {
                        return { dataElement: key, value };
                    }
                    return [];
                },
            );
            await db.events.put({ ...values, dataValues: mergedValues });
            setOpen(false);
            try {
                await engine.mutate({
                    resource: "events",
                    type: "create",
                    data: { events: [{ ...values, dataValues }] },
                    params: { async: false },
                });
                await queryClient.invalidateQueries({
                    queryKey: ["signals", search.q, search.dates],
                });
            } catch (error) {
                await db.events.put(values);
            }
        }
    };
    return (
        <Flex>
            <Modal
                open={open}
                title="Update Signal"
                okText="Update Signal"
                cancelText="Cancel Signal"
                okButtonProps={{ autoFocus: true, htmlType: "submit" }}
                onCancel={() => setOpen(false)}
                styles={{ body: { maxHeight: "70vh", overflow: "auto" } }}
                destroyOnHidden
                modalRender={(dom) => (
                    <Form
                        layout="vertical"
                        form={form}
                        name="form_in_modal"
                        initialValues={Object.entries(
                            values?.dataValues ?? {},
                        ).reduce((acc, [key, value]) => {
                            const element = programStageDataElements.get(key);
                            if (element?.valueType === "BOOLEAN") {
                                set(acc, key, value === "true");
                            } else {
                                set(acc, key, value);
                            }
                            return acc;
                        }, {})}
                        clearOnDestroy
                        onFinish={(values) => onCreate(values)}
                    >
                        {dom}
                    </Form>
                )}
                width="70%"
            >
                <Tabs
                    items={orderBy(
                        programStageSections,
                        "sortOrder",
                        "asc",
                    ).map((a) => {
                        return {
                            tabKey: String(a.sortOrder),
                            key: String(a.sortOrder),
                            label: a.name,
                            disabled: !active.includes(String(a.sortOrder)),
                            children: (
                                <Row gutter={24}>
                                    {a.dataElements.map((de) => {
                                        const dataElement =
                                            programStageDataElements.get(de);
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
                                        } else if (
                                            dataElement?.valueType === "BOOLEAN"
                                        ) {
                                            element = (
                                                <Checkbox>
                                                    {dataElement.formName ??
                                                        dataElement?.name}
                                                </Checkbox>
                                            );
                                        } else if (
                                            dataElement?.valueType === "DATE" ||
                                            dataElement?.valueType ===
                                                "DATETIME"
                                        ) {
                                            element = (
                                                <DatePicker
                                                    style={{ width: "100%" }}
                                                />
                                            );
                                        } else if (
                                            dataElement?.valueType ===
                                            "LONG_TEXT"
                                        ) {
                                            element = (
                                                <Input.TextArea rows={4} />
                                            );
                                        } else if (
                                            [
                                                "NUMBER",
                                                "INTEGER",
                                                "INTEGER_POSITIVE",
                                            ].includes(
                                                dataElement?.valueType ?? "",
                                            )
                                        ) {
                                            element = (
                                                <InputNumber
                                                    style={{ width: "100%" }}
                                                />
                                            );
                                        }

                                        return (
                                            <Col span={8} key={de}>
                                                {dataElement?.valueType ===
                                                    "DATE" ||
                                                dataElement?.valueType ===
                                                    "DATETIME" ? (
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
                                                        getValueProps={(
                                                            value,
                                                        ) => ({
                                                            value: value
                                                                ? dayjs(value)
                                                                : null,
                                                        })}
                                                        normalize={(value) => {
                                                            return value
                                                                ? value.format(
                                                                      "YYYY-MM-DD",
                                                                  )
                                                                : null;
                                                        }}
                                                    >
                                                        {element}
                                                    </Form.Item>
                                                ) : (
                                                    <Form.Item
                                                        key={de}
                                                        label={
                                                            dataElement?.valueType ===
                                                            "BOOLEAN"
                                                                ? null
                                                                : dataElement?.formName ??
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
                                                )}
                                            </Col>
                                        );
                                    })}
                                </Row>
                            ),
                        };
                    })}
                    activeKey={current}
                    onChange={(x) => {
                        setCurrent(() => String(x));
                    }}
                />
            </Modal>
        </Flex>
    );
}
