type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

export type FactoryTypeFromGraphQLType<T> = Required<NonNullableFields<T>>
