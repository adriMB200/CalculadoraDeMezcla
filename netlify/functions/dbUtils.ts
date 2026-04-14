export const isMissingTableError = (error: unknown, tableName: string) => {
    if (!(error instanceof Error)) {
        return false;
    }

    const missingTablePattern = new RegExp(`relation .*${tableName}.* does not exist`, 'i');
    return missingTablePattern.test(error.message);
};

export const extractYearFromModel = (model: string) => {
    const match = model.match(/(19|20)\d{2}/);
    return match ? Number(match[0]) : null;
};
