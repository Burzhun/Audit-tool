export async function goToCollectionDocument(collectionName, recordID) {
    await driver.navigate().to(`${process.env.BASE_URL}/detail/${collectionName}/${recordID}`);
}

export function convert24(str) {
    if (str.slice(-2) === "AM" && str.slice(0, 2) === "12") {
       return "0" + str.slice(2, -3)
    } else {
        if (str.slice(-2) === "AM") {
            return str.slice(0, -3)
        } else {
            if (str.slice(-2) === "PM" && str.slice(0, 2) === "12") {
                return str.slice(0, -3)
            } else {
                return String(str.slice(str.indexOf(':')+1) + 12) + str.slice(str.indexOf(':')+1, str.indexOf(' ')+1)
            }
        }
    }
}
export function equalsIgnoreOrder(a, b) {
    if (a.length !== b.length) return false;
    const uniqueValues = new Set([...a, ...b]);
    for (const v of uniqueValues) {
        const aCount = a.filter(e => e === v).length;
        const bCount = b.filter(e => e === v).length;
        if (aCount !== bCount) return false;
    }
    return true;
}