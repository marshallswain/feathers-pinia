export function clearStorage(storage: Storage = window.localStorage) {
    //  Question @Marshall 
    //  For mocked storage how can we iterate over keys?
    Object.keys(storage).map(key => {
        if (key.startsWith("service.")) {
            storage.removeItem(key)
        }
    })
}