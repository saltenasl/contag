export type WithFieldsNormalized<
  // eslint-disable-next-line @typescript-eslint/ban-types
  OriginalType extends {},
  ObjectPropsNormalized extends keyof OriginalType,
  RecordPropsNormalized extends keyof OriginalType
> = Omit<OriginalType, ObjectPropsNormalized | RecordPropsNormalized> &
  Record<ObjectPropsNormalized, { __ref: string }> &
  Record<RecordPropsNormalized, Array<{ __ref: string }>>
