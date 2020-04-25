export default (content: Readonly<string>) => {
    if (!content) return 'application/x-www-form-urlencoded; charset=utf-8';
    if (content.slice(0, 5) === '<?xml') return 'text/xml';
    return 'text/tab-separated-values; charset=iso-8859-1';
};
