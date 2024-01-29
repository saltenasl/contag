import { yoga } from 'src/server'
import { DEFAULT_PORT } from 'src/start'

const request = async (
  query: string,
  {
    variables,
    headers = {},
  }: {
    headers?: Partial<Record<string, string>>
    variables?: object
  } = {}
) => {
  const response = await yoga.fetch(`http://localhost:${DEFAULT_PORT}`, {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  })

  if (response.status === 500) {
    throw new Error(JSON.stringify(await response.json()))
  }

  return response
}

export default request
