import { GraphQLError } from 'graphql'
import firebase from 'firebase-admin'

const decodeToken = async (
  tokenHeader: string
): Promise<{ email: string; picture?: string | undefined; name?: string }> => {
  const [_, token] = tokenHeader.split(' ')

  if (!token) {
    throw new GraphQLError('Unauthorized', {
      extensions: {
        code: 401,
      },
    })
  }

  try {
    const {
      email,
      email_verified: emailVerified,
      picture,
      name,
    } = await firebase.auth().verifyIdToken(token)

    if (!email || !emailVerified) {
      throw new Error('User has no email or email is not verified')
    }

    return {
      email,
      picture,
      name,
    }
  } catch (error) {
    throw new GraphQLError('Unauthorized', {
      extensions: {
        code: 401,
      },
    })
  }
}

export default decodeToken
