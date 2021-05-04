export function clearStorage() {
    Object.keys(localStorage).map(key => {
        if (key.substring(0, 8) === "service.") {
            localStorage.removeItem(key)
        }
    })
}