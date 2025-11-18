import React, { useEffect, useState } from "react";
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
import { EventWithValues, ProgramRuleResult } from "../types";
import { executeProgramRules, nextAction } from "../utils";
import { useLoaderData } from "@tanstack/react-router";

const isDate = (valueType: string | undefined) => {
    return (
        valueType === "DATE" ||
        valueType === "DATETIME" ||
        valueType === "TIME" ||
        valueType === "AGE"
    );
};

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
    const {
        programStageSections,
        programStageDataElements,
        programRuleVariables,
        programRules,
    } = useLoaderData({ from: "__root__" });

    const { engine, queryClient } = SignalsRoute.useRouteContext();
    const search = SignalsRoute.useSearch();
    const [form] = Form.useForm();

    const [ruleResult, setRuleResult] = useState<ProgramRuleResult>({
        hiddenFields: new Set<string>(),
        assignments: {},
        messages: [],
        warnings: [],
        shownFields: new Set<string>(),
    });

    // -------------------------
    // Apply DHIS2 Rules
    // -------------------------
    const evaluateRules = (currentValues: Record<string, any>) => {
        const result = executeProgramRules({
            programRules,
            programRuleVariables,
            dataValues: currentValues,
        });

        setRuleResult(result);

        // Apply ASSIGN actions to the form
        for (const [key, value] of Object.entries(result.assignments)) {
            form.setFieldValue(key, value);
        }
    };

    // -------------------------
    // Evaluate once when modal opens or values load
    // -------------------------
    useEffect(() => {
        if (values) {
            evaluateRules(values.dataValues ?? {});
        }
    }, [open, values]);

    // -------------------------
    // On value change → re-run rules
    // -------------------------
    const handleValuesChange = (_changed: any, allValues: any) => {
        evaluateRules(allValues);
    };

    const onCreate = async (updatedValues: any) => {
        if (values) {
            const mergedValues: Record<string, string> = {
                ...values.dataValues,
                ...updatedValues,
            };

            const dataValues = Object.entries(mergedValues).flatMap(
                ([key, value]) => {
                    const element = programStageDataElements.get(key);
                    if (element?.valueType === "BOOLEAN") {
                        return { dataElement: key, value: !!value };
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
                cancelText="Cancel"
                okButtonProps={{ autoFocus: true, htmlType: "submit" }}
                onCancel={() => setOpen(false)}
                styles={{ body: { maxHeight: "70vh", overflow: "auto" } }}
                modalRender={(dom) => (
                    <Form
                        form={form}
                        layout="vertical"
                        name="signal_form"
                        initialValues={Object.entries(
                            values?.dataValues ?? {},
                        ).reduce((acc, [key, value]) => {
                            const el = programStageDataElements.get(key);
                            if (el?.valueType === "BOOLEAN") {
                                set(acc, key, value === "true");
                            } else {
                                set(acc, key, value);
                            }
                            return acc;
                        }, {})}
                        onValuesChange={handleValuesChange}
                        onFinish={onCreate}
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
                    ).map((section) => ({
                        key: String(section.sortOrder),
                        label: section.name,
                        disabled: !active.includes(String(section.sortOrder)),
                        children: (
                            <Row gutter={24}>
                                {section.dataElements.map((de) => {
                                    const dataElement =
                                        programStageDataElements.get(de);
                                    if (!dataElement) return null;

                                    if (ruleResult.hiddenFields.has(de))
                                        return null;

                                    let element: React.ReactNode = <Input />;

                                    if (
                                        dataElement.optionSetValue &&
                                        dataElement.optionSet
                                    ) {
                                        element = (
                                            <Select
                                                options={dataElement.optionSet.options.map(
                                                    (o) => ({
                                                        label: o.name,
                                                        value: o.code,
                                                    }),
                                                )}
                                                allowClear
                                            />
                                        );
                                    } else if (
                                        dataElement.valueType === "BOOLEAN"
                                    ) {
                                        element = (
                                            <Checkbox>
                                                {dataElement.formName ??
                                                    dataElement.name}
                                            </Checkbox>
                                        );
                                    } else if (
                                        dataElement.valueType === "DATE" ||
                                        dataElement.valueType === "DATETIME" ||
                                        dataElement.valueType === "TIME" ||
                                        dataElement.valueType === "AGE"
                                    ) {
                                        element = (
                                            <DatePicker
                                                style={{ width: "100%" }}
                                            />
                                        );
                                    } else if (
                                        dataElement.valueType === "LONG_TEXT"
                                    ) {
                                        element = <Input.TextArea rows={4} />;
                                    } else if (
                                        [
                                            "NUMBER",
                                            "INTEGER",
                                            "INTEGER_POSITIVE",
                                        ].includes(dataElement.valueType ?? "")
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
                                                    dataElement.valueType ===
                                                    "BOOLEAN"
                                                        ? null
                                                        : dataElement.formName ??
                                                          dataElement.name
                                                }
                                                name={de}
                                                rules={[
                                                    {
                                                        required:
                                                            dataElement.compulsory,
                                                        message: `${dataElement.name} is required`,
                                                    },
                                                ]}
                                                // getValueProps={(value) =>
                                                //     dataElement.valueType?.startsWith(
                                                //         "DATE",
                                                //     )
                                                //         ? {
                                                //               value: value
                                                //                   ? dayjs(value)
                                                //                   : null,
                                                //           }
                                                //         : {}
                                                // }
                                                // normalize={(value) =>
                                                //     dayjs.isDayjs(value)
                                                //         ? value.format(
                                                //               "YYYY-MM-DD",
                                                //           )
                                                //         : value
                                                // }

                                                getValueProps={
                                                    isDate(
                                                        dataElement?.valueType,
                                                    )
                                                        ? (value) =>
                                                              isDate(
                                                                  dataElement?.valueType,
                                                              )
                                                                  ? {
                                                                        value: value
                                                                            ? dayjs(
                                                                                  value,
                                                                              )
                                                                            : null,
                                                                    }
                                                                  : {}
                                                        : undefined
                                                }
                                                normalize={(value) =>
                                                    isDate(
                                                        dataElement?.valueType,
                                                    ) && dayjs.isDayjs(value)
                                                        ? value.format(
                                                              "YYYY-MM-DD",
                                                          )
                                                        : value
                                                }
                                            >
                                                {element}
                                            </Form.Item>
                                        </Col>
                                    );
                                })}
                            </Row>
                        ),
                    }))}
                    activeKey={current}
                    onChange={(x) => setCurrent(String(x))}
                />
            </Modal>
        </Flex>
    );
}
