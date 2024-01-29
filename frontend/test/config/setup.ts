import '@testing-library/jest-dom'
import 'cross-fetch/polyfill'
import { configure } from '@testing-library/react'
import uploadFileToStorage from 'src/FileUpload/utils/uploadFileToStorage'
import getFileDownloadURL from 'src/FileUpload/utils/getFileDownloadURL'

export const STORAGE_ORIGIN = 'https://mocked-storage-origin.com'

jest.mock('src/FileUpload/utils/uploadFileToStorage')
jest.mock('src/FileUpload/utils/getFileDownloadURL')

configure({ asyncUtilTimeout: 400 }) // https://github.com/testing-library/dom-testing-library/issues/524#issuecomment-1206509128

// https://github.com/jsdom/jsdom/issues/3002
document.createRange = () => {
  const range = new Range()

  range.getBoundingClientRect = () => new DOMRect(1, 1, 10, 10)

  range.getClientRects = () => {
    return {
      item: () => null,
      length: 0,
      [Symbol.iterator]: jest.fn(),
    }
  }
  range.setStart = () => {}
  range.setEnd = () => {}

  return range
}

document.createRange = () => {
  const range = new Range()

  range.getBoundingClientRect = () => {
    return {
      x: 0,
      y: 0,
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      toJSON: () => {},
    }
  }

  range.getClientRects = () => {
    return {
      item: () => null,
      length: 0,
      *[Symbol.iterator]() {},
    }
  }

  return range
}

beforeEach(() => {
  process.env.GRAPHQL_API_URL = 'http://localhost/'
  Element.prototype.scrollIntoView = jest.fn()

  jest.mocked(uploadFileToStorage).mockResolvedValue(undefined)
  jest
    .mocked(getFileDownloadURL)
    .mockImplementation(async (filename) => `${STORAGE_ORIGIN}/${filename}`)
})
