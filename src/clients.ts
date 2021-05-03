export const clients: { [name: string]: any } = {}

export function registerClient(name: string, client: any) {
  if (!clients[name]) {
    clients[name] = client
  }
}
