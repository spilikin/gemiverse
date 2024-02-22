import { expect, test } from 'vitest'
import { fetchData } from './index'

test('fetchData returns "Hello Typescript"', () => {
    console.log('fetchData', fetchData("ref"))
    expect(fetchData("ref")).toBe('Hello Typescript')
})