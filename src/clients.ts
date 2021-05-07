export const clients: { [name: string]: any } = {}

export function registerClient(name: string, client: any): void {
  if (!clients[name]) {
    clients[name] = client
  }
}
