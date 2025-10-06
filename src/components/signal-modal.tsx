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
import { nextAction } from "../utils";
import { orderBy } from "lodash";

export default function SignalModal({
    open,
    setOpen,
    actions: { next, active },
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    onCreate: (values: any) => void;
    actions: ReturnType<typeof nextAction>;
}) {
    const { programStageSections, programStageDataElements } = useLoaderData({
        from: "__root__",
    });
    const [form] = Form.useForm();
    const onCreate = (values: any) => {
        setOpen(false);
    };
    // const section = programStageSections[2];
    return (
        <Flex>
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
                        initialValues={{}}
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
                                        }
                                        if (
                                            dataElement?.valueType === "BOOLEAN"
                                        ) {
                                            element = (
                                                <Checkbox>
                                                    {dataElement.formName ??
                                                        dataElement?.name}
                                                </Checkbox>
                                            );
                                        }
                                        if (
                                            dataElement?.valueType === "DATE" ||
                                            dataElement?.valueType ===
                                                "DATETIME"
                                        ) {
                                            element = (
                                                <DatePicker
                                                    style={{ width: "100%" }}
                                                />
                                            );
                                        }
                                        if (
                                            dataElement?.valueType ===
                                            "LONG_TEXT"
                                        ) {
                                            element = (
                                                <Input.TextArea rows={4} />
                                            );
                                        }

                                        if (
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
                                            </Col>
                                        );
                                    })}
                                </Row>
                            ),
                        };
                    })}
                    activeKey={next}
                />
            </Modal>
        </Flex>
    );
}
