import request from './utils/request'

jest.mock('firebase-admin/app')

describe('healthCheck', () => {
  it('returns 200', async () => {
    const response = await request(`#graphql query healthCheck {__typename}`)

    expect(response.status).toBe(200)
  })
})
