import dayjs from 'dayjs'
import actionExpectationFactory from 'test/factories/actionExpectation'
import publicUserFactory from 'test/factories/publicUser'
import questionFactory from 'test/factories/question'
import { DATE_TIME_PICKER_INPUT_FORMAT } from 'test/utils/constants'
import renderItemPage from './utils/renderItemPage'

describe('action expectation', () => {
  describe('label', () => {
    describe('without complete until', () => {
      it('no assignee', async () => {
        const question = questionFactory.build({
          to: [],
          actionExpectation: actionExpectationFactory.build(),
        })
        const { screen } = await renderItemPage({ id: question.id })

        const actionExpectationLabel =
          screen.getByLabelText('action expectation')

        expect(actionExpectationLabel).toHaveTextContent('Action expected')
      })

      it('single assignee', async () => {
        const assignee = publicUserFactory.build()
        const question = questionFactory.build({
          to: [assignee],
          actionExpectation: actionExpectationFactory.build(),
        })
        const { screen } = await renderItemPage({ id: question.id })

        const actionExpectationLabel =
          screen.getByLabelText('action expectation')

        expect(actionExpectationLabel).toHaveTextContent('Action expected by')
        expect(
          screen.getByLabelText(`${assignee.name} avatar`)
        ).toBeInTheDocument()
      })

      it('multiple assignees', async () => {
        const firstAssignee = publicUserFactory.build()
        const secondAssignee = publicUserFactory.build()
        const question = questionFactory.build({
          to: [firstAssignee, secondAssignee],
          actionExpectation: actionExpectationFactory.build({}),
        })
        const { screen } = await renderItemPage({ id: question.id })

        const actionExpectationLabel =
          screen.getByLabelText('action expectation')

        expect(actionExpectationLabel).toHaveTextContent(
          `Action expected by any one of ${question.to.length}`
        )

        expect(
          screen.getByLabelText(`${firstAssignee.name} avatar`)
        ).toBeInTheDocument()
        expect(
          screen.getByLabelText(`${secondAssignee.name} avatar`)
        ).toBeInTheDocument()
      })
    })

    describe('with complete until', () => {
      it('no assignee', async () => {
        const completeUntilDateTimeString = dayjs().format(
          DATE_TIME_PICKER_INPUT_FORMAT
        )

        const question = questionFactory.build({
          to: [],
          actionExpectation: actionExpectationFactory.build({
            completeUntil: new Date(completeUntilDateTimeString).toISOString(),
          }),
        })
        const { screen } = await renderItemPage({ id: question.id })

        const actionExpectationLabel =
          screen.getByLabelText('action expectation')

        expect(actionExpectationLabel).toHaveTextContent(
          `Action expected by ${completeUntilDateTimeString}`
        )
      })

      it('single assignee', async () => {
        const completeUntilDateTimeString = dayjs().format(
          DATE_TIME_PICKER_INPUT_FORMAT
        )

        const assignee = publicUserFactory.build()
        const question = questionFactory.build({
          to: [assignee],
          actionExpectation: actionExpectationFactory.build({
            completeUntil: new Date(completeUntilDateTimeString).toISOString(),
          }),
        })
        const { screen } = await renderItemPage({ id: question.id })

        const actionExpectationLabel =
          screen.getByLabelText('action expectation')

        expect(actionExpectationLabel).toHaveTextContent(
          `Action expected by by ${completeUntilDateTimeString}`
        )
        expect(
          screen.getByLabelText(`${assignee.name} avatar`)
        ).toBeInTheDocument()
      })

      it('multiple assignees', async () => {
        const completeUntilDateTimeString = dayjs().format(
          DATE_TIME_PICKER_INPUT_FORMAT
        )

        const firstAssignee = publicUserFactory.build()
        const secondAssignee = publicUserFactory.build()
        const question = questionFactory.build({
          to: [firstAssignee, secondAssignee],
          actionExpectation: actionExpectationFactory.build({
            completeUntil: new Date(completeUntilDateTimeString).toISOString(),
          }),
        })
        const { screen } = await renderItemPage({ id: question.id })

        const actionExpectationLabel =
          screen.getByLabelText('action expectation')

        expect(actionExpectationLabel).toHaveTextContent(
          `Action expected by any one of ${question.to.length} by ${completeUntilDateTimeString}`
        )

        expect(
          screen.getByLabelText(`${firstAssignee.name} avatar`)
        ).toBeInTheDocument()
        expect(
          screen.getByLabelText(`${secondAssignee.name} avatar`)
        ).toBeInTheDocument()
      })
    })
  })
})
