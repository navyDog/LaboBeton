export const sanitizeCSV = (value) => {
    if (!value) return '';
    const str = String(value);
    if (/^[=+\-@]/.test(str)) return `'${str}`;
    return str.replaceAll(';', ',').replaceAll('"', '""');
};