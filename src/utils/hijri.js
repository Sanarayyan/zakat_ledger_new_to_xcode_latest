export const getFormattedHijriDate = (date, lang) => {
    try {
        // Try umalqura first for more accurate dates, fallback to basic islamic
        let formatter;
        try {
            const locale = lang === 'ml' ? 'ml-IN-u-ca-islamic-umalqura' : 'en-GB-u-ca-islamic-umalqura';
            formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
            const locale = lang === 'ml' ? 'ml-IN-u-ca-islamic' : 'en-GB-u-ca-islamic';
            formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
        }

        const parts = formatter.formatToParts(date);
        
        let day = '';
        let month = '';
        let year = '';

        parts.forEach(part => {
            if (part.type === 'day') day = part.value;
            if (part.type === 'month') month = part.value;
            if (part.type === 'year') year = part.value;
        });

        // Some older Android devices might format year natively as English regardless, which is fine
        if (!day || !month || !year) throw new Error("Invalid parts");

        if (lang === 'ml') {
            return `${day} ${month} ${year} ഹിജ്റി`;
        }
        return `${day} ${month} ${year} AH`;

    } catch (e) {
        return '';
    }
};
