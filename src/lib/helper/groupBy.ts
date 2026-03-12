export const groupByToArray = <T>(array: T[], key: keyof T): T[][] => {
    const groupedObject = array.reduce(
        (result, item) => {
            const groupKey = String(item[key]);
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        },
        {} as Record<string, T[]>,
    );

    return Object.values(groupedObject);
};

export const groupByToObject = <T>(
    array: T[],
    key: keyof T,
): Record<string, T[]> => {
    const groupedObject = array.reduce(
        (result, item) => {
            const groupKey = String(item[key]);
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        },
        {} as Record<string, T[]>,
    );

    return groupedObject;
};
