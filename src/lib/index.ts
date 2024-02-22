// simple service to fetch data from the server using standard fetch api
export function fetchData(env: string) {
  return "Hello Typescript";
}

export function getEnvLabel(env: string) {
    switch (env) {
        case 'test':
            return 'Test'
        case 'ref':
            return 'Referenz'
        case 'prod':
            return 'Produktiv'
        default:
            return 'Unknown'
    }
}