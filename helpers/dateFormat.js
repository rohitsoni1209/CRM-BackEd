const isISODateString = (str) => {
    // Comprehensive ISO 8601 date regex
    const isoDateRegex = /^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|([+-]\d{2}:\d{2}))?)?)$/;
    return isoDateRegex.test(str);
};

const convertDatesToStrings = (payload) => {
    const payloadArray = Array.isArray(payload) ? payload : [payload];
    return payloadArray.map(item => convertDatesInObject(item));
};

const convertStringsToDates = (payload) => {
    const payloadArray = Array.isArray(payload) ? payload : [payload];
    return payloadArray.map(item => convertStringsInObject(item));
};

const convertDatesInObject = (obj) => {
    const newItem = { ...obj };
    for (let key = 0; key < Object.keys(newItem).length; key++) {
        if (newItem[key] instanceof Date) {
            newItem[key] = newItem[key].toISOString();
        }
    }
    // for (const key in newItem) {
    //     if (newItem[key] instanceof Date) {
    //         newItem[key] = newItem[key].toISOString();
    //     }
    // }
    return newItem;
};

const convertStringsInObject = (obj) => {
    const newItem = { ...obj };
    for (const key in newItem) {
        if (typeof newItem[key] === 'string' && isISODateString(newItem[key])) {
            console.log(`Converting ${key}: ${newItem[key]} to Date object`);
            newItem[key] = new Date(newItem[key]);
        }
    }
    return newItem;
};

module.exports = {
    isISODateString,
    convertDatesToStrings,
    convertStringsToDates,
    convertDatesInObject,
    convertStringsInObject,
};