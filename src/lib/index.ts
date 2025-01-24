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