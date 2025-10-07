import { z } from "zod";
const UserSchema = z.object({
    uid: z.string(),
    username: z.string(),
    firstName: z.string(),
    surname: z.string(),
});
export const SMSSchema = z.object({
    created: z.string(),
    lastUpdated: z.string(),
    translations: z.array(z.unknown()),
    createdBy: z.object({
        id: z.string(),
        code: z.null(),
        name: z.string(),
        displayName: z.string(),
        username: z.string(),
    }),
    favorites: z.array(z.unknown()),
    sharing: z.object({
        external: z.boolean(),
        users: z.object({}),
        userGroups: z.object({}),
    }),
    user: z.object({
        id: z.string(),
        code: z.null(),
        name: z.string(),
        displayName: z.string(),
        username: z.string(),
    }),
    access: z.object({
        manage: z.boolean(),
        externalize: z.boolean(),
        write: z.boolean(),
        read: z.boolean(),
        update: z.boolean(),
        delete: z.boolean(),
    }),
    favorite: z.boolean(),
    id: z.string(),
    attributeValues: z.array(z.unknown()),
    smsencoding: z.string(),
    sentdate: z.string(),
    receiveddate: z.string(),
    originator: z.string(),
    gatewayid: z.string(),
    text: z.string(),
    smsstatus: z.string(),
    forwarded: z.boolean().optional(),
});

export const EventSchema = z.object({
    programStage: z.string(),
    programType: z.string(),
    orgUnit: z.string(),
    program: z.string(),
    event: z.string(),
    status: z.string(),
    orgUnitName: z.string(),
    eventDate: z.string(),
    created: z.string(),
    lastUpdated: z.string(),
    deleted: z.boolean(),
    attributeOptionCombo: z.string(),
    dataValues: z.array(
        z.object({
            lastUpdated: z.string(),
            created: z.string(),
            dataElement: z.string(),
            value: z.string(),
            providedElsewhere: z.boolean(),
            createdBy: UserSchema,
            updatedBy: UserSchema,
        }),
    ),
    notes: z.array(z.unknown()),
});
export const EventWithValuesSchema = EventSchema.extend({
    dataValues: z.record(z.string(), z.string().nullable()),
    notes: z.array(z.unknown()),
});

export const SMSSearchParams = z.object({
    page: z.number().min(1).optional().default(1),
    pageSize: z.number().min(1).max(100).optional().default(10),
    q: z.string().optional().default(""),
    dates: z.string().optional(),
});

export const ProgramStageSchema = z.object({
    programStageDataElements: z.array(
        z.object({
            dataElement: z.object({
                code: z.string(),
                name: z.string(),
                formName: z.string(),
                valueType: z.string(),
                optionSet: z.object({
                    options: z.array(
                        z.object({
                            code: z.string(),
                            name: z.string(),
                            id: z.string(),
                        }),
                    ),
                }),
                optionSetValue: z.boolean(),
                id: z.string(),
            }),
            compulsory: z.boolean(),
            displayInReports: z.boolean(),
        }),
    ),
    programStageSections: z.array(
        z.object({
            name: z.string(),
            description: z.string(),
            dataElements: z.array(z.object({ id: z.string() })),
            sortOrder: z.number(),
            displayName: z.string(),
        }),
    ),
});

export type SMS = z.infer<typeof SMSSchema>;
export type Event = z.infer<typeof EventSchema>;
export type EventWithValues = z.infer<typeof EventWithValuesSchema>;
export type SMSSearchParams = z.infer<typeof SMSSearchParams>;
export type ProgramStage = z.infer<typeof ProgramStageSchema>;
