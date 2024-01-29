// These side-effects use firestore and are unit tested separately
// Due to lack of a e2e solution to test firestore
jest.mock('src/filesystem/allowUserAccessToFile')
jest.mock('src/filesystem/removeAllAccessToFile')
jest.mock('src/filesystem/removeUserAccessToFile')
