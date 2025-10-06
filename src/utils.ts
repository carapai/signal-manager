export const nextAction = (values: any) => {
    if (values["VaO1WnueBpu"]) {
        return { next: "", active: ["0", "1", "2", "3"] };
    }
    if (values["FidiishnZJZ"] === "Discard") {
        return { next: "", active: ["0", "1", "2"] };
    }
    if (values["FidiishnZJZ"] === "Alert") {
        return { next: "4", active: ["0", "1", "2"] };
    }
    if (values["RZMTtSyhdHY"] === "Discard") {
        return { next: "", active: ["0", "1"] };
    }
    if (values["RZMTtSyhdHY"] === "Relevant") {
        return { next: "3", active: ["0", "1", "2"] };
    }
    return { next: "1", active: ["0", "1"] };
};
