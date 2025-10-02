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
});

export const EventSchema = z.object({
    event: z.string(),
    status: z.string(),
    program: z.string(),
    programStage: z.string(),
    orgUnit: z.string(),
    orgUnitName: z.string(),
    occurredAt: z.string(),
    scheduledAt: z.string(),
    storedBy: z.string(),
    followup: z.boolean(),
    deleted: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    attributeOptionCombo: z.string(),
    attributeCategoryOptions: z.string(),
    assignedUser: z.object({}),
    createdBy: UserSchema,
    updatedBy: UserSchema,
    dataValues: z.array(
        z.object({
            createdAt: z.string(),
            updatedAt: z.string(),
            providedElsewhere: z.boolean(),
            dataElement: z.string(),
            value: z.string(),
            createdBy: UserSchema,
            updatedBy: UserSchema,
        }),
    ),
    notes: z.array(z.unknown()),
});

export const SMSSearchParams = z.object({
    page: z.number().min(1).optional().default(1),
    pageSize: z.number().min(1).max(100).optional().default(10),
    q: z.string().optional().default(""),
    dates: z.string().optional(),
});

export type SMS = z.infer<typeof SMSSchema>;
export type Event = z.infer<typeof EventSchema>;
export type SMSSearchParams = z.infer<typeof SMSSearchParams>;
