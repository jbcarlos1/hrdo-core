export function convertToUTC(date: string | Date): Date {
    return new Date(date);
}

export function convertToUTC8(date: string | Date): Date {
    const utcDate = new Date(date);
    const utc8Date = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
    return utc8Date;
}

export function getStartOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return new Date(newDate.getTime() - 8 * 60 * 60 * 1000);
}

export function getEndOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return new Date(newDate.getTime() - 8 * 60 * 60 * 1000);
}

export function createDateFilter(
    dateFrom: string | null,
    dateTo: string | null
) {
    const filters = [];

    if (dateFrom && !isNaN(new Date(dateFrom).getTime())) {
        const utc8Date = convertToUTC8(dateFrom);
        const fromDate = getStartOfDay(utc8Date);
        filters.push({
            createdAt: {
                gte: fromDate,
            },
        });
    }

    if (dateTo && !isNaN(new Date(dateTo).getTime())) {
        const utc8Date = convertToUTC8(dateTo);
        const toDate = getEndOfDay(utc8Date);
        filters.push({
            createdAt: {
                lte: toDate,
            },
        });
    }

    return filters;
}
